import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const MAX_DIMENSION = 1024;

export async function compressImageToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return compressOnWeb(uri);
  }

  // 네이티브: expo-image-manipulator — PNG 출력 (OpenAI API 요구)
  const manipulated = await manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { format: SaveFormat.PNG, base64: true }
  );

  if (!manipulated.base64) {
    throw new Error('이미지 변환에 실패했습니다.');
  }

  return manipulated.base64;
}

// 웹: Canvas API로 리사이즈 + PNG base64 변환
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
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
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
