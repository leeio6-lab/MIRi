import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_DIMENSION = 768;
const JPEG_QUALITY = 0.65;
/** base64 기준 최대 허용 크기 (Supabase Edge Function body 2MB 제한 고려) */
const MAX_BASE64_BYTES = 1_200_000; // ~1.2MB

export async function compressImageToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return compressOnWeb(uri);
  }

  // 네이티브: 원본 크기를 먼저 확인하여 긴 쪽 기준으로 리사이즈
  let resizeOp: { resize: { width: number } } | { resize: { height: number } };

  try {
    // expo-image-manipulator: 일단 원본 크기를 가져오기 위해 no-op 실행
    const probe = await manipulateAsync(uri, [], { base64: false });
    const { width: origW, height: origH } = probe;

    if (origW >= origH) {
      // 가로가 더 김 → width 기준 리사이즈
      resizeOp = { resize: { width: Math.min(origW, MAX_DIMENSION) } };
    } else {
      // 세로가 더 김 → height 기준 리사이즈
      resizeOp = { resize: { height: Math.min(origH, MAX_DIMENSION) } };
    }
  } catch {
    // 크기 확인 실패 시 안전하게 width 기준
    resizeOp = { resize: { width: MAX_DIMENSION } };
  }

  let quality = JPEG_QUALITY;
  let base64: string | undefined;

  // 품질을 낮추며 크기 제한 맞추기 (최대 2회 재시도)
  for (let attempt = 0; attempt < 3; attempt++) {
    const manipulated = await manipulateAsync(
      uri,
      [resizeOp],
      { format: SaveFormat.JPEG, compress: quality, base64: true }
    );
    base64 = manipulated.base64 ?? undefined;

    if (base64 && base64.length <= MAX_BASE64_BYTES) break;

    // 너무 크면 품질을 낮춤
    quality = Math.max(0.3, quality - 0.15);
  }

  if (!base64) {
    throw new Error('이미지 변환에 실패했습니다.');
  }

  if (__DEV__) {
    console.log(`[ImageCompress] base64 size: ${(base64.length / 1024).toFixed(0)}KB, quality: ${quality}`);
  }

  return base64;
}

// 웹: Canvas API로 리사이즈 + JPEG base64 변환
function compressOnWeb(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 지원 불가'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      // 품질을 낮추며 크기 제한 맞추기
      let quality = JPEG_QUALITY;
      let base64 = '';
      for (let attempt = 0; attempt < 3; attempt++) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        base64 = dataUrl.split(',')[1] ?? '';
        if (base64 && base64.length <= MAX_BASE64_BYTES) break;
        quality = Math.max(0.3, quality - 0.15);
      }

      if (!base64) {
        reject(new Error('이미지 변환에 실패했습니다.'));
        return;
      }
      resolve(base64);
    };
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = uri;
  });
}
