export const colors = {
  yellow: '#F5D23D',
  black: '#575B58',
  white: '#FFFFFF',
  cream: '#FBF4EB',
  butter: '#FFEDA8',
  pink: '#F283AF',
  surfacePink: '#FCE8F1',
  surface: '#FFFFFF',
  surfaceHigh: '#F5EFE6',
  borderSubtle: '#E9E0D3',
  borderPink: '#F5C4D8',
  textPrimary: '#1E1A16',
  textSecondary: '#6E655A',
  textMuted: '#9A9186',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

export const tabBar = {
  contentInset: spacing.lg,
  shellRadius: radius.full,
  activeRadius: radius.full,
  barOverlay: 'rgba(255, 248, 240, 0.12)',
  barBorder: 'rgba(255, 255, 255, 0.3)',
  barFallbackBg: 'rgba(36, 34, 32, 0.42)',
  activeOnPill: '#3A3835',
  activeSegmentBg: 'rgba(255, 237, 168, 0.95)',
  activeSegmentBorder: 'rgba(255, 255, 255, 0.83)',
  blurIntensity: 70,
  iconSize: 22,
  fabAddIconSize: 44,
  shadowColor: '#0c0b0a',
  shadowOpacity: 0.32,
  shadowOffsetY: 12,
  shadowRadius: 28,
  elevation: 18,
  rowMinHeight: 58,
} as const;

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, fontFamily: 'Geologica_700Bold' },
  h2: { fontSize: 24, fontWeight: '700' as const, fontFamily: 'Geologica_700Bold' },
  h3: { fontSize: 20, fontWeight: '700' as const, fontFamily: 'Geologica_700Bold' },
  body: { fontSize: 16, fontWeight: '400' as const, fontFamily: 'Manrope_400Regular' },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, fontFamily: 'Manrope_500Medium' },
  bodyBold: { fontSize: 16, fontWeight: '700' as const, fontFamily: 'Manrope_700Bold' },
  caption: { fontSize: 13, fontWeight: '400' as const, fontFamily: 'Manrope_400Regular' },
  label: { fontSize: 12, fontWeight: '500' as const, fontFamily: 'Manrope_500Medium' },
} as const;
