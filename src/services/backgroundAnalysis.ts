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

// Concurrency locks — 동시 요청 방어
let _sajuLock = false;
let _faceLock = false;

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
    isUnknownTime?: boolean;
  };
  pillars: FourPillarsCalc | null;
}

export function startSajuAnalysis({ user, pillars }: SajuParams) {
  if (_sajuLock) return;
  _sajuLock = true;
  const gen = ++sajuGen;
  const store = useFortuneStore.getState();
  store.setSajuPending(true);
  store.setSajuReady(false);
  store.setError(null);

  const pillarInfo = pillars
    ? formatPillarInfo(pillars, user.birthYear, user.birthMonth, user.birthDay, user.gender, user.isUnknownTime)
    : undefined;

  if (__DEV__) console.log('[BackgroundAnalysis] Saju: calling API...');

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
      if (__DEV__) console.log('[BackgroundAnalysis] Saju: success');
      const s = useFortuneStore.getState();
      s.setSajuResult(result);
      s.saveAndRecord('saju', true, result);
      s.setSajuReady(true);
    })
    .catch((err) => {
      if (gen !== sajuGen) return;
      if (__DEV__) console.error('[BackgroundAnalysis] Saju error:', err);
      useFortuneStore.getState().setError(
        err instanceof Error ? err.message : 'Analysis failed',
      );
      // 결제 후 분석 실패 시 크레딧 복원
      usePurchaseStore.getState().restoreCredit('saju');
    })
    .finally(() => {
      _sajuLock = false;
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
  if (_faceLock) return;
  _faceLock = true;
  const gen = ++faceGen;
  const store = useFortuneStore.getState();
  store.setFacePending(true);
  store.setFaceReady(false);
  store.setFaceResult(null);
  store.setTransformedImage(null);
  store.setFaceNoFace(null);
  store.setError(null);

  if (__DEV__) console.log('[BackgroundAnalysis] Face: compressing image...');

  let _compressedBase64: string | null = null;

  compressImageToBase64(imageUri)
    .then((base64) => {
      if (gen !== faceGen) return Promise.reject(new Error('_cancelled'));
      _compressedBase64 = base64;
      if (__DEV__) console.log(
        `[BackgroundAnalysis] Face: image ${(base64.length / 1024).toFixed(0)}KB, calling API...`,
      );
      return api.analyzeFace(base64, locale, true, analysisMode);
    })
    .then((response) => {
      if (gen !== faceGen) return;
      if (__DEV__) console.log('[BackgroundAnalysis] Face: API success');
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
      if (__DEV__) console.error('[BackgroundAnalysis] Face error:', err);
      useFortuneStore.getState().setError(
        err instanceof Error ? err.message : '관상 분석에 실패했습니다.',
      );
      // 결제 후 분석 실패 시 티켓 복원 (얼굴 미감지는 위에서 이미 처리)
      usePurchaseStore.getState().restoreCredit('face');
    })
    .finally(() => {
      _faceLock = false;
      // 압축 base64 메모리 해제 (1~2MB 절약)
      _compressedBase64 = null;
      if (gen !== faceGen) return;
      useFortuneStore.getState().setFacePending(false);
    });
}
