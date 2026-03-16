import { Platform } from 'react-native';

/**
 * 클라이언트 사이드 얼굴 사전 검증 (무료, 즉시)
 * - Web (Chrome/Edge): FaceDetector API
 * - Web (Safari/Firefox): Canvas 피부톤 분석 fallback
 * - Native: 기본 true 반환 (서버에서 검증)
 *
 * 반환: { hasFace: boolean, confidence: 'high' | 'medium' | 'skip' }
 */

interface FaceCheckResult {
  hasFace: boolean;
  confidence: 'high' | 'medium' | 'skip';
}

export async function detectFaceLocal(imageUri: string): Promise<FaceCheckResult> {
  if (Platform.OS !== 'web') {
    // 네이티브: 클라이언트 검증 스킵 → 서버에서 검증
    return { hasFace: true, confidence: 'skip' };
  }

  try {
    // 1차: 브라우저 FaceDetector API (Chrome/Edge — 정확도 높음)
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      const result = await detectWithBrowserAPI(imageUri);
      if (result !== null) return result;
    }

    // 2차: Canvas 피부톤 분석 (Safari/Firefox fallback)
    return await detectWithSkinTone(imageUri);
  } catch (err) {
    if (__DEV__) console.warn('[FaceDetect] Error:', err);
    // 에러 시 통과시킴 (서버에서 최종 검증)
    return { hasFace: true, confidence: 'skip' };
  }
}

// ─── 브라우저 FaceDetector API (Chrome/Edge 전용) ───
async function detectWithBrowserAPI(imageUri: string): Promise<FaceCheckResult | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUri;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      setTimeout(reject, 5000); // 5초 타임아웃
    });

    // @ts-ignore — FaceDetector는 Chrome 전용 API
    const detector = new (window as any).FaceDetector({ maxDetectedFaces: 1, fastMode: true });
    const faces = await detector.detect(img);

    return {
      hasFace: faces.length > 0,
      confidence: 'high',
    };
  } catch {
    return null; // API 미지원 → fallback
  }
}

// ─── Canvas 피부톤 분석 (모든 브라우저) ───
async function detectWithSkinTone(imageUri: string): Promise<FaceCheckResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUri;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve({ hasFace: true, confidence: 'skip' }); return; }

        // 작은 크기로 리사이즈 (성능)
        const size = 80;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        // 중앙 60% 영역만 분석 (얼굴은 보통 중앙에 있음)
        const margin = Math.floor(size * 0.2);
        let skinPixels = 0;
        let totalChecked = 0;

        for (let y = margin; y < size - margin; y++) {
          for (let x = margin; x < size - margin; x++) {
            const i = (y * size + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (isSkinTone(r, g, b)) skinPixels++;
            totalChecked++;
          }
        }

        const skinRatio = skinPixels / totalChecked;

        // 피부톤이 10% 이상이면 얼굴일 가능성 높음
        resolve({
          hasFace: skinRatio > 0.10,
          confidence: 'medium',
        });
      } catch {
        resolve({ hasFace: true, confidence: 'skip' });
      }
    };
    img.onerror = () => resolve({ hasFace: true, confidence: 'skip' });

    // 타임아웃
    setTimeout(() => resolve({ hasFace: true, confidence: 'skip' }), 3000);
  });
}

// ─── 피부톤 감지 (다양한 피부색 커버) ───
function isSkinTone(r: number, g: number, b: number): boolean {
  // RGB 기반 피부톤 범위 (밝은~어두운 피부 모두 커버)
  // YCbCr 색공간 변환 기반
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.169 * r - 0.331 * g + 0.500 * b;
  const cr = 128 + 0.500 * r - 0.419 * g - 0.081 * b;

  return y > 40 && cb > 77 && cb < 127 && cr > 133 && cr < 173;
}
