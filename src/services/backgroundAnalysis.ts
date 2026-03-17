/**
 * Background Analysis Service
 *
 * API 호출을 컴포넌트 생명주기와 분리하여, 사용자가 화면을 벗어나도
 * 분석이 계속 실행되고 결과가 스토어에 저장됩니다.
 */
import { api, formatPillarInfo } from './api';
import { useFortuneStore } from '../stores/fortuneStore';
import { usePurchaseStore } from '../stores/purchaseStore';
import { compressImageToBase64 } from '../utils/image-compress';
import type { FaceResult } from '../types/api';
import type { FourPillarsCalc } from '../utils/saju-calc';
import type { AnalysisMode } from '../stores/userStore';

// Generation counters — 새 분석 시작 시 이전 분석 결과 무시
let sajuGen = 0;
let faceGen = 0;

// ─── 사주 분석 ───────────────────────────────────────────────────────────────

interface SajuParams {
  user: {
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    birthHour: number;
    isLunar: boolean;
    gender: 'male' | 'female';
    locale: string;
    name?: string;
  };
  pillars: FourPillarsCalc | null;
}

export function startSajuAnalysis({ user, pillars }: SajuParams) {
  const gen = ++sajuGen;
  const store = useFortuneStore.getState();
  store.setSajuPending(true);
  store.setSajuReady(false);
  store.setError(null);

  const pillarInfo = pillars
    ? formatPillarInfo(pillars, user.birthYear, user.birthMonth, user.birthDay, user.gender)
    : undefined;

  console.log('[BackgroundAnalysis] Saju: calling API...');

  api.analyzeSaju(
    {
      year: user.birthYear,
      month: user.birthMonth,
      day: user.birthDay,
      hour: user.birthHour,
      isLunar: user.isLunar,
      gender: user.gender,
    },
    user.locale,
    true,
    'integrated',
    pillarInfo,
    user.name,
  )
    .then((result) => {
      if (gen !== sajuGen) return;
      console.log('[BackgroundAnalysis] Saju: success');
      const s = useFortuneStore.getState();
      s.setSajuResult(result);
      s.saveAndRecord('saju', true, result);
      s.setSajuReady(true);
    })
    .catch((err) => {
      if (gen !== sajuGen) return;
      console.error('[BackgroundAnalysis] Saju error:', err);
      useFortuneStore.getState().setError(
        err instanceof Error ? err.message : 'Analysis failed',
      );
    })
    .finally(() => {
      if (gen !== sajuGen) return;
      useFortuneStore.getState().setSajuPending(false);
    });
}

// ─── 관상 분석 ───────────────────────────────────────────────────────────────

interface FaceParams {
  imageUri: string;
  locale: string;
  analysisMode: AnalysisMode;
}

export function startFaceAnalysis({ imageUri, locale, analysisMode }: FaceParams) {
  const gen = ++faceGen;
  const store = useFortuneStore.getState();
  store.setFacePending(true);
  store.setFaceReady(false);
  store.setFaceResult(null);
  store.setTransformedImage(null);
  store.setFaceNoFace(null);
  store.setError(null);

  console.log('[BackgroundAnalysis] Face: compressing image...');

  compressImageToBase64(imageUri)
    .then((base64) => {
      if (gen !== faceGen) return Promise.reject(new Error('_cancelled'));
      console.log(
        `[BackgroundAnalysis] Face: image ${(base64.length / 1024).toFixed(0)}KB, calling API...`,
      );
      return api.analyzeFace(base64, locale, true, analysisMode);
    })
    .then((response) => {
      if (gen !== faceGen) return;
      console.log('[BackgroundAnalysis] Face: API success');
      const s = useFortuneStore.getState();

      // 얼굴 미감지
      if (response.noFace) {
        s.setFaceNoFace(
          response.reason ?? '정면 얼굴이 잘 보이는 사진을 사용해주세요.',
        );
        return;
      }

      // 관상화 이미지
      if (response.transformedImage) {
        s.setTransformedImage(response.transformedImage);
      }

      // 분석 결과
      let result: FaceResult | null = null;
      if (response.analysis) {
        result = response.analysis;
      } else if (response.overallScore !== undefined) {
        result = response as unknown as FaceResult;
      }

      if (result) {
        s.setFaceResult(result);
        usePurchaseStore.getState().useFaceTicket();
        const img = s.transformedImageBase64;
        s.saveAndRecord('face', true, result, img ? { imageBase64: img } : undefined);
        s.setFaceReady(true);
        return;
      }

      // 서버 분석 에러
      if (response.analysisError) {
        const msg = response.analysisError;
        if (msg.includes('API key')) {
          s.setError('서버 설정 오류입니다. 잠시 후 다시 시도해주세요.');
        } else if (msg.includes('timeout') || msg.includes('abort')) {
          s.setError('분석 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.');
        } else {
          s.setError('관상 분석에 실패했습니다. 다시 시도해주세요.');
        }
        return;
      }

      s.setError('분석 결과를 받지 못했습니다. 다시 시도해주세요.');
    })
    .catch((err) => {
      if (gen !== faceGen) return;
      if (err instanceof Error && err.message === '_cancelled') return;
      console.error('[BackgroundAnalysis] Face error:', err);
      useFortuneStore.getState().setError(
        err instanceof Error ? err.message : '관상 분석에 실패했습니다.',
      );
    })
    .finally(() => {
      if (gen !== faceGen) return;
      useFortuneStore.getState().setFacePending(false);
    });
}
