export const theme = {
  colors: {
    bg: {
      primary: '#FFFFFF',
      secondary: '#F5F1EA',
      tertiary: '#EDE8DF',
      elevated: '#FFFFFF',
    },
    gold: {
      primary: '#E8B04A',      // 메인 골드. CTA
      light: '#D4A84B',        // 테두리, 장식
      dark: '#C4912E',         // 눌림 상태
      muted: '#B8A070',        // 그림자 색
    },
    // 다크(gold) 카드 내부 텍스트 전용
    goldCard: {
      bg: '#1C1C1E',
      text: '#F2EDE3',
      textSecondary: '#C4B99A',
      textTertiary: '#8A7E68',
    },
    elements: {
      wood: '#5B7A4A',         // 자연 초록
      fire: '#B85450',         // 웜 레드
      earth: '#8B6E4E',        // 웜 브라운
      metal: '#6B7B8D',        // 쿨톤 실버
      water: '#3D6B8E',        // 딥 블루
    },
    text: {
      primary: '#1A1A1A',      // #000 금지
      secondary: '#555555',
      tertiary: '#999999',
      inverse: '#FFFFFF',
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.95)',
      border: 'rgba(212, 168, 75, 0.12)',    // 골드 틴트 보더
    },
    border: {
      subtle: 'rgba(212, 168, 75, 0.12)',
      medium: 'rgba(212, 168, 75, 0.25)',
      divider: 'rgba(212, 168, 75, 0.08)',   // 구분선 전용
    },
    success: '#2D7A5F',
    warning: '#C4943D',
    error: '#B85450',
    info: '#3D6B8E',
  },
  fonts: {
    display: 'System',
    heading: 'System',
    body: 'System',
    bodyBold: 'System',
    caption: 'System',
  },
  typo: {
    screenTitle: { fontSize: 22, fontWeight: '700' as const, color: '#1A1A1A', letterSpacing: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '600' as const, color: '#1A1A1A', letterSpacing: 1.5 },
    cardTitle: { fontSize: 14, fontWeight: '600' as const, color: '#1A1A1A', letterSpacing: 1 },
    body: { fontSize: 13, fontWeight: '400' as const, color: '#555555', lineHeight: 22 },
    caption: { fontSize: 11, fontWeight: '400' as const, color: '#999999', letterSpacing: 0.5 },
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
      shadowColor: '#B8A070',       // 골드 틴트 그림자
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 3,
    },
  },
} as const;

export type Theme = typeof theme;
