import { Platform, Text, type TextProps } from 'react-native';

type IconTone = 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand' | 'butter';

const MATERIAL_SYMBOLS_ROUNDED: Record<300 | 500, string> = {
  300: 'MaterialSymbolsRounded_300Light',
  500: 'MaterialSymbolsRounded_500Medium',
};

export type MSIconProps = Omit<TextProps, 'children'> & {
  iconColor?: string;
  weight?: 300 | 500;
  name:
    | 'calendar_today'
    | 'calendar_month'
    | 'restaurant'
    | 'wb_sunny'
    | 'dark_mode'
    | 'sync'
    | 'swap_horiz'
    | 'close'
    | 'shopping_bag'
    | 'bar_chart'
    | 'check_box'
    | 'check_box_outline_blank'
    | 'add';
  size?: number;
  tone?: IconTone;
  className?: string;
};

const toneClass: Record<IconTone, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  muted: 'text-text-muted',
  inverse: 'text-text-inverse',
  brand: 'text-brand-yellow',
  butter: 'text-text-butter',
};

function opticalNudgeForAdd(name: MSIconProps['name'], px: number) {
  if (name !== 'add') return undefined;
  return Platform.select({
    android: { textAlignVertical: 'center' as const },
    ios: { transform: [{ translateY: Math.max(1, Math.round(px * 0.12)) }] },
    default: { transform: [{ translateY: Math.max(1, Math.round(px * 0.1)) }] },
  });
}

export function MSIcon({
  name,
  size = 20,
  tone = 'primary',
  weight = 500,
  iconColor,
  className,
  style,
  ...props
}: MSIconProps) {
  return (
    <Text
      {...props}
      className={[iconColor ? '' : toneClass[tone], className].filter(Boolean).join(' ')}
      style={[
        {
          fontFamily: MATERIAL_SYMBOLS_ROUNDED[weight],
          fontSize: size,
          lineHeight: size,
          textAlign: 'center',
          ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
        },
        opticalNudgeForAdd(name, size),
        iconColor ? { color: iconColor } : null,
        style,
      ]}>
      {name}
    </Text>
  );
}
