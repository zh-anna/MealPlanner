import { View, type ViewProps } from 'react-native';

import { UIText } from './ui-text';

export type StatProps = ViewProps & {
  label: string;
  value: string;
};

export function Stat({ label, value, className, ...props }: StatProps & { className?: string }) {
  return (
    <View {...props} className={['items-center', className].filter(Boolean).join(' ')}>
      <UIText tone="pink" variant="bodyBold" className="text-[18px] leading-[22px]">
        {value}
      </UIText>
      <UIText tone="secondary" variant="label" className="mt-0.5">
        {label}
      </UIText>
    </View>
  );
}

