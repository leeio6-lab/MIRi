import { useCallback, useState } from 'react';
import { useFortuneStore } from '../stores/fortuneStore';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { api } from '../services/api';
import type { FaceResult } from '../types/api';
import { compressImageToBase64 } from '../utils/image-compress';

export function useFace() {
  const { user } = useAuthStore();
  const { analysisMode } = useUserStore();
  const {
    faceResult, setFaceResult,
    transformedImageBase64, setTransformedImage,
    isLoading, setLoading, error, setError,
  } = useFortuneStore();
  const [noFaceDetected, setNoFaceDetected] = useState(false);
  const [noFaceReason, setNoFaceReason] = useState('');

  const analyze = useCallback(async (imageUri: string) => {
    setLoading(true);
    setError(null);
    setTransformedImage(null);
    setFaceResult(null);
    setNoFaceDetected(false);
    setNoFaceReason('');

    try {
      const base64 = await compressImageToBase64(imageUri);
      const locale = user?.locale ?? 'ko';

      const response = await api.analyzeFace(base64, locale, true, analysisMode);

      // 얼굴 미감지
      if (response.noFace) {
        setNoFaceDetected(true);
        setNoFaceReason(response.reason ?? '정면 얼굴이 잘 보이는 사진을 사용해주세요.');
        setLoading(false);
        return null;
      }

      // 관상화 이미지 저장
      if (response.transformedImage) {
        setTransformedImage(response.transformedImage);
      }

      // 분석 결과
      if (response.analysis) {
        setFaceResult(response.analysis);
        return response.analysis;
      }

      if (response.overallScore !== undefined) {
        const directResult = response as unknown as FaceResult;
        setFaceResult(directResult);
        return directResult;
      }

      throw new Error('분석 결과를 받지 못했습니다. 다시 시도해주세요.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '관상 분석에 실패했습니다.';
      setFaceResult(null);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, analysisMode]);

  const clearNoFace = useCallback(() => {
    setNoFaceDetected(false);
    setNoFaceReason('');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { faceResult, transformedImageBase64, analyze, isLoading, error, clearError, noFaceDetected, noFaceReason, clearNoFace };
}
