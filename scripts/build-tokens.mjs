import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const colors = {
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
};

const spacing = { xs: 4, sm: 8, md: 16, lg: 20, xl: 24, xxl: 32 };
const radius = { sm: 8, md: 12, lg: 16, full: 999 };

const typography = {
  h1: { fontSize: 32, fontWeight: '700', fontFamily: 'Geologica_700Bold' },
  h2: { fontSize: 24, fontWeight: '700', fontFamily: 'Geologica_700Bold' },
  h3: { fontSize: 20, fontWeight: '700', fontFamily: 'Geologica_700Bold' },
  body: { fontSize: 16, fontWeight: '400', fontFamily: 'Manrope_400Regular' },
  bodyMedium: { fontSize: 16, fontWeight: '500', fontFamily: 'Manrope_500Medium' },
  bodyBold: { fontSize: 16, fontWeight: '700', fontFamily: 'Manrope_700Bold' },
  caption: { fontSize: 13, fontWeight: '400', fontFamily: 'Manrope_400Regular' },
  label: { fontSize: 12, fontWeight: '500', fontFamily: 'Manrope_500Medium' },
};

function px(value) {
  return `${value}px`;
}

const out = {
  colors: {
    brand: { lime: colors.lime },
    bg: {
      canvas: colors.cream,
      surface: colors.surface,
      surfaceHigh: colors.surfaceHigh,
      tint: colors.surfaceTint,
      butter: colors.butter,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      muted: colors.textMuted,
      inverse: colors.black,
      butter: colors.butter,
      accent: colors.emerald,
    },
    border: {
      subtle: colors.borderSubtle,
      accent: colors.borderAccent,
    },
  },
  spacing: Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, px(v)])),
  borderRadius: Object.fromEntries(Object.entries(radius).map(([k, v]) => [k, px(v)])),
  fontFamily: {
    heading: [typography.h1.fontFamily],
    body: [typography.body.fontFamily],
    bodyMedium: [typography.bodyMedium.fontFamily],
    bodyBold: [typography.bodyBold.fontFamily],
  },
};

const outPath = path.join(ROOT, 'constants', 'tokens.generated.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outPath}`);
