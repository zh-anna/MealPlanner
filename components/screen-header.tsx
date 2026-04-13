import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { ProfileAvatarImage } from '@/components/profile-avatar-image';
import { MSIcon } from '@/components/ui/ms-icon';
import { UIText } from '@/components/ui/ui-text';
import { screenHeader } from '@/constants/layout';
import { colors } from '@/constants/tokens';
import { useMealPlanStore } from '@/stores/use-meal-plan-store';

type Props = {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode | null;
};

function AccountEntryButton() {
  const rawUri = useMealPlanStore((s) => s.profileAvatarUrl);

  return (
    <Pressable
      onPress={() => router.push('/account')}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Акаунт"
      className="h-11 w-11 items-center justify-center active:opacity-70"
      style={{ overflow: 'visible' }}>
      <View className="items-center justify-center" style={{ overflow: 'visible' }}>
        {rawUri?.trim() ? (
          <ProfileAvatarImage key={rawUri} uri={rawUri} size={32} />
        ) : (
          <MSIcon name="account_circle" filled size={32} iconColor={colors.textPrimary} />
        )}
      </View>
    </Pressable>
  );
}

export function ScreenHeader({ title, subtitle, left, right }: Props) {
  const accountButton = <AccountEntryButton />;

  const rightSlot = right === null ? null : right === undefined ? accountButton : right;

  return (
    <View
      className="flex-row items-start bg-bg-canvas px-lg pt-sm"
      style={{
        overflow: 'visible',
        zIndex: screenHeader.zIndex,
        elevation: screenHeader.elevation,
      }}>
      {left ? (
        <View className="mr-sm shrink-0 self-start pt-0.5">{left}</View>
      ) : null}
      <View className="min-h-[44px] flex-1 justify-start pr-md" style={{ overflow: 'visible' }}>
        <UIText variant="h2">{title}</UIText>
        {subtitle ? (
          <UIText tone="secondary" variant="caption" className="mt-xs">
            {subtitle}
          </UIText>
        ) : null}
      </View>
      {rightSlot ? <View className="shrink-0 self-start pt-0.5">{rightSlot}</View> : null}
    </View>
  );
}
