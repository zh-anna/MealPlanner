import { Platform, Text as RNText, type TextProps as RNTextProps } from 'react-native';

type TextTone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand' | 'butter' | 'pink';
type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodyMedium' | 'bodyBold' | 'caption' | 'label';

export type UITextProps = RNTextProps & {
  tone?: TextTone;
  variant?: TextVariant;
};

const toneClass: Record<TextTone, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  muted: 'text-text-muted',
  inverse: 'text-text-inverse',
  brand: 'text-brand-yellow',
  butter: 'text-text-butter',
  pink: 'text-text-pink',
};

const variantClass: Record<TextVariant, string> = {
  h1: 'font-heading text-[32px] leading-[36px]',
  h2: 'font-heading text-[24px] leading-[30px]',
  h3: 'font-heading text-[20px] leading-[26px]',
  body: 'font-body text-[16px] leading-[24px]',
  bodyMedium: 'font-bodyMedium text-[16px] leading-[24px]',
  bodyBold: 'font-bodyBold text-[16px] leading-[20px]',
  caption: 'font-body text-[12px] leading-[18px]',
  label: 'font-bodyMedium text-[14px]',
};

export function UIText({
  tone = 'primary',
  variant = 'body',
  className,
  style,
  ...props
}: UITextProps & { className?: string }) {
  return (
    <RNText
      {...props}
      className={[toneClass[tone], variantClass[variant], className].filter(Boolean).join(' ')}
      style={[Platform.OS === 'android' ? { includeFontPadding: false } : undefined, style]}
    />
  );
}

