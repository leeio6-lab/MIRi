import { Platform } from 'react-native';

export const PRODUCT_IDS = {
  SAJU_DETAIL: Platform.select({
    ios: 'com.myeongri.saju.detail',
    android: 'saju_detail',
    default: 'saju_detail',
  })!,
  FACE_ANALYSIS: Platform.select({
    ios: 'com.myeongri.face.analysis',
    android: 'face_analysis',
    default: 'face_analysis',
  })!,
  COMPATIBILITY: Platform.select({
    ios: 'com.myeongri.compatibility',
    android: 'compatibility',
    default: 'compatibility',
  })!,
} as const;

export const CONSUMABLE_IDS = [
  PRODUCT_IDS.SAJU_DETAIL,
  PRODUCT_IDS.FACE_ANALYSIS,
  PRODUCT_IDS.COMPATIBILITY,
];

// API 원가: 사주 ~$0.01, 관상 ~$0.09 (GPT-4o-mini + gpt-image-1), 궁합 ~$0.01
export const PRODUCT_PRICES: Record<string, { ko: string; ja: string; en: string }> = {
  [PRODUCT_IDS.SAJU_DETAIL]: { ko: '₩770', ja: '¥100', en: '$0.99' },
  [PRODUCT_IDS.FACE_ANALYSIS]: { ko: '₩770', ja: '¥100', en: '$0.99' },
  [PRODUCT_IDS.COMPATIBILITY]: { ko: '₩770', ja: '¥100', en: '$0.99' },
};

export function getProductId(type: 'saju' | 'face' | 'compatibility'): string {
  const map = {
    saju: PRODUCT_IDS.SAJU_DETAIL,
    face: PRODUCT_IDS.FACE_ANALYSIS,
    compatibility: PRODUCT_IDS.COMPATIBILITY,
  };
  return map[type];
}
