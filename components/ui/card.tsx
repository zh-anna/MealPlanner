import { View, type ViewProps } from 'react-native';
import { twMerge } from 'tailwind-merge';

const cardBase =
  'rounded-md border border-border-subtle bg-bg-surface px-md py-md';

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View {...props} className={twMerge(cardBase, className)} />;
}
