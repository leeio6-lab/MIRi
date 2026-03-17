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
  const [transformError, setTransformError] = useState<string | null>(null);

  const analyze = useCallback(async (imageUri: string) => {
    setLoading(true);
    setError(null);
    setTransformedImage(null);
    setFaceResult(null);
    setNoFaceDetected(false);
    setNoFaceReason('');
    setTransformError(null);

    try {
      const base64 = await compressImageToBase64(imageUri);
      const locale = user?.locale ?? 'ko';

      console.log(`[Face] image size: ${(base64.length / 1024).toFixed(0)}KB`);

      const response = await api.analyzeFace(base64, locale, true, analysisMode);
      console.log('[Face] response OK');

      if (__DEV__) {
        console.log('[Face] response keys:', Object.keys(response));
        console.log('[Face] transformedImage:', response.transformedImage ? `${(response.transformedImage.length / 1024).toFixed(0)}KB` : 'NULL');
        console.log('[Face] analysis:', response.analysis ? 'present' : 'NULL');
        if (response.transformError) console.log('[Face] transformError:', response.transformError);
        if (response.analysisError) console.log('[Face] analysisError:', response.analysisError);
      }

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
        if (__DEV__) console.log('[Face] setTransformedImage done');
      } else if (response.transformError) {
        console.warn('[Face] Transform failed:', response.transformError);
        setTransformError(response.transformError);
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

      // 서버가 분석 에러를 반환한 경우 — 구체적 에러 메시지 포함
      if (response.analysisError) {
        const msg = response.analysisError;
        if (__DEV__) console.error('[Face] Server analysis error:', msg);
        // 사용자에게 친화적인 에러 메시지로 변환
        if (msg.includes('API key')) {
          throw new Error('서버 설정 오류입니다. 잠시 후 다시 시도해주세요.');
        }
        if (msg.includes('timeout') || msg.includes('abort')) {
          throw new Error('분석 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
        }
        throw new Error('관상 분석에 실패했습니다. 다시 시도해주세요.');
      }

      // 분석과 변환 모두 실패
      if (response.transformError && !response.analysis) {
        if (__DEV__) console.error('[Face] Both analysis and transform failed:', response.transformError);
      }

      throw new Error('분석 결과를 받지 못했습니다. 다시 시도해주세요.');
    } catch (err) {
      console.error('[Face] FULL ERROR:', err);
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

  return { faceResult, transformedImageBase64, analyze, isLoading, error, clearError, noFaceDetected, noFaceReason, clearNoFace, transformError };
}
