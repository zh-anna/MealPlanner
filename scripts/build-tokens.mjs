// Builds constants/tokens.generated.json from the same values as constants/tokens.ts — keep both in sync.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** @type {const} */
const colors = {
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
    brand: { yellow: colors.yellow },
    bg: {
      canvas: colors.cream,
      surface: colors.surface,
      surfaceHigh: colors.surfaceHigh,
      pink: colors.surfacePink,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      muted: colors.textMuted,
      inverse: colors.black,
      butter: colors.butter,
      pink: colors.pink,
    },
    border: {
      subtle: colors.borderSubtle,
      pink: colors.borderPink,
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
