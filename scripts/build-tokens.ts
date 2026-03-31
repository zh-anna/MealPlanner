import fs from 'node:fs';
import path from 'node:path';

import { colors, radius, spacing, typography } from '../constants/tokens';

type TailwindTokens = {
  colors: Record<string, any>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  fontFamily: Record<string, string[]>;
};

function px(value: number) {
  return `${value}px`;
}

const out: TailwindTokens = {
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

const outPath = path.join(process.cwd(), 'constants', 'tokens.generated.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${outPath}`);

