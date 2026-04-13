export const colors = {
  lime: '#798349',
  black: '#3A3832',
  white: '#FFFFFF',
  cream: '#F4EFE6',
  butter: '#FFEDA8',
  emerald: '#2A4A3E',
  sage: '#6B9078',
  mint: '#7CB878',
  olive: '#4D5348',
  surface: '#FFFFFF',
  surfaceHigh: '#F7F2EA',
  surfaceTint: '#EEF4E8',
  borderSubtle: '#D4D1CA',
  borderAccent: '#BAB7B0',
  textPrimary: '#1C1B17',
  textSecondary: '#5C574E',
  textMuted: '#908B7E',
  forest: '#062D1F',
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
  contentInset: spacing.md,
  fabGap: spacing.sm,
  shellRadius: radius.full,
  activeRadius: radius.full,
  barOverlay: 'rgba(6, 45, 31, 0.22)',
  barBorder: 'rgba(255, 255, 255, 0.22)',
  barFallbackBg: 'rgba(6, 45, 31, 0.94)',
  activeSegmentBg: 'rgba(121, 131, 73, 0.95)',
  activeSegmentBorder: 'rgba(255, 255, 255, 0.55)',
  blurIntensity: 72,
  iconSize: 22,
  fabAddIconSize: 44,
  shadowColor: '#020806',
  shadowOpacity: 0.35,
  shadowOffsetY: 14,
  shadowRadius: 28,
  elevation: 20,
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
