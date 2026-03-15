export const theme = {
  colors: {
    bg: {
      primary: '#FFFFFF',
      secondary: '#F7F7F7',
      tertiary: '#F0F0F0',
      elevated: '#FFFFFF',
    },
    gold: {
      primary: '#B59530',
      light: '#D4B245',
      dark: '#8A7220',
      muted: '#C4A74A',
    },
    // 다크(gold) 카드 내부 텍스트 전용
    goldCard: {
      bg: '#1C1C1E',
      text: '#F2EDE3',
      textSecondary: '#C4B99A',
      textTertiary: '#8A7E68',
    },
    elements: {
      wood: '#3D8B37',
      fire: '#C4503D',
      earth: '#A68B5B',
      metal: '#8C8C8C',
      water: '#2C5F8A',
    },
    text: {
      primary: '#1C1C1E',
      secondary: '#636366',
      tertiary: '#AEAEB2',
      inverse: '#FFFFFF',
    },
    glass: {
      bg: 'rgba(255, 255, 255, 0.95)',
      border: 'rgba(0, 0, 0, 0.08)',
    },
    success: '#2D7A5F',
    warning: '#C4943D',
    error: '#C4503D',
    info: '#2C5F8A',
  },
  fonts: {
    display: 'System',
    heading: 'System',
    body: 'System',
    bodyBold: 'System',
    caption: 'System',
  },
  typo: {
    screenTitle: { fontSize: 26, fontWeight: '700' as const, color: '#1C1C1E', letterSpacing: -0.5 },
    sectionTitle: { fontSize: 18, fontWeight: '600' as const, color: '#1C1C1E' },
    cardTitle: { fontSize: 16, fontWeight: '700' as const, color: '#1C1C1E' },
    body: { fontSize: 14, fontWeight: '400' as const, color: '#636366', lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '300' as const, color: '#AEAEB2' },
    bigScore: { fontSize: 48, fontWeight: '700' as const, color: '#B59530' },
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
    sectionGap: 32,
    cardPadding: 20,
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
  },
} as const;

export type Theme = typeof theme;
