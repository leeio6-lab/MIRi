export const theme = {
  colors: {
    bg: {
      primary: '#1C1B1B',           // 메인 배경 (다크)
      secondary: '#242323',         // 카드 내부, 입력 필드
      tertiary: '#2B2A29',          // 비활성 바, 구분선 배경
      elevated: '#21201F',          // 카드 배경
    },
    gold: {
      primary: '#E8B04A',           // 메인 골드. CTA
      light: '#F6D98E',             // 밝은 골드 (강조 텍스트)
      dark: '#C4912E',              // 어두운 골드 (눌림)
      muted: '#9C8F60',             // 뮤트 골드 (그림자)
    },
    // 다크 카드 내부 (이제 기본)
    goldCard: {
      bg: '#1C1C1E',
      text: '#F2EDE3',
      textSecondary: '#C4B99A',
      textTertiary: '#8A7E68',
    },
    elements: {
      wood: '#6B9A5A',              // 밝은 초록 (다크 배경 대비)
      fire: '#E07070',              // 밝은 레드
      earth: '#C49A6C',             // 밝은 브라운
      metal: '#8FA0B4',             // 밝은 실버
      water: '#5A9AC4',             // 밝은 블루
    },
    text: {
      primary: '#FCF9F8',           // 메인 텍스트 (밝음)
      secondary: '#B0A99E',         // 보조 텍스트
      tertiary: '#6E6862',          // 3차 텍스트
      inverse: '#1C1B1B',           // 역전 (밝은 배경 위)
    },
    glass: {
      bg: 'rgba(43, 42, 41, 0.6)',
      border: 'rgba(255, 255, 255, 0.06)',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      medium: 'rgba(232, 176, 74, 0.15)',
      divider: 'rgba(255, 255, 255, 0.04)',
    },
    success: '#4CAF7A',
    warning: '#E8B04A',
    error: '#E07070',
    info: '#5A9AC4',
  },
  fonts: {
    display: 'System',
    heading: 'System',
    body: 'System',
    bodyBold: 'System',
    caption: 'System',
  },
  typo: {
    screenTitle: { fontSize: 22, fontWeight: '700' as const, color: '#FCF9F8', letterSpacing: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '600' as const, color: '#FCF9F8', letterSpacing: 1.5 },
    cardTitle: { fontSize: 14, fontWeight: '600' as const, color: '#FCF9F8', letterSpacing: 1 },
    body: { fontSize: 13, fontWeight: '400' as const, color: '#B0A99E', lineHeight: 22 },
    caption: { fontSize: 11, fontWeight: '400' as const, color: '#6E6862', letterSpacing: 0.5 },
    bigScore: { fontSize: 42, fontWeight: '500' as const, color: '#E8B04A' },
    button: { fontSize: 16, fontWeight: '700' as const },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 32,
    xxl: 48,
    screenPadding: 20,
    sectionGap: 20,
    cardPadding: 24,
    cardGap: 12,
  },
  radius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 24,
    full: 9999,
  },
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

export type Theme = typeof theme;
