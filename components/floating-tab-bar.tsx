import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MSIcon } from '@/components/ui/ms-icon';
import { absoluteFill, hairlineWidth } from '@/constants/layout';
import { colors, spacing, tabBar, typography } from '@/constants/tokens';

type IconName = ComponentProps<typeof MSIcon>['name'];

const TAB_ORDER = ['index', 'shopping', 'stats'] as const;

const TAB_META: Record<(typeof TAB_ORDER)[number], { label: string; icon: IconName }> = {
  index: { label: 'Розклад', icon: 'calendar_month' },
  shopping: { label: 'Покупки', icon: 'shopping_bag' },
  stats: { label: 'Статистика', icon: 'bar_chart' },
};

const shadowStyle = Platform.select({
  ios: {
    shadowColor: tabBar.shadowColor,
    shadowOffset: { width: 0, height: tabBar.shadowOffsetY },
    shadowOpacity: tabBar.shadowOpacity,
    shadowRadius: tabBar.shadowRadius,
  },
  android: { elevation: tabBar.elevation },
  default: {},
});

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottom = Math.max(insets.bottom, spacing.sm + spacing.xs);
  const insetH = tabBar.contentInset;

  const items = TAB_ORDER.map((name) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return null;
    const routeIndex = state.routes.indexOf(route);
    const meta = TAB_META[name];
    return (
      <TabItem
        key={route.key}
        meta={meta}
        isFocused={state.index === routeIndex}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (state.index !== routeIndex && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }}
      />
    );
  });

  const rowStyle = {
    flexDirection: 'row' as const,
    alignItems: 'stretch' as const,
    width: '100%' as const,
    minHeight: tabBar.rowMinHeight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
    borderWidth: hairlineWidth,
    borderColor: tabBar.barBorder,
  };

  const shellRadius = tabBar.shellRadius;

  const barChrome = (
    <View
      style={[
        rowStyle,
        Platform.OS === 'web'
          ? { backgroundColor: tabBar.barFallbackBg }
          : { backgroundColor: tabBar.barOverlay },
      ]}>
      {items}
    </View>
  );

  const onAddMetrics = () => {
    router.push('/(tabs)/stats?addMetrics=1');
  };

  return (
    <View
      pointerEvents="box-none"
      style={[absoluteFill, { justifyContent: 'flex-end', alignItems: 'stretch' }]}>
      <View
        pointerEvents="box-none"
        style={{
          paddingLeft: insets.left + insetH,
          paddingRight: insets.right + insetH,
          marginBottom: bottom,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: spacing.md }}>
          <View style={{ flex: 1, minWidth: 0, justifyContent: 'center',}}>
            <TabBarSurface borderRadius={shellRadius}>{barChrome}</TabBarSurface>
          </View>
          <TabBarFabButton onPress={onAddMetrics} />
        </View>
      </View>
    </View>
  );
}

function TabBarSurface({
  borderRadius,
  children,
  fill,
}: {
  borderRadius: number;
  children: ReactNode;
  fill?: boolean;
}) {
  const innerBase = {
    borderRadius,
    overflow: 'hidden' as const,
    ...(fill ? { flex: 1, minHeight: 0 } : {}),
  };
  return (
    <View
      style={{
        ...shadowStyle,
        borderRadius,
        overflow: 'visible',
        ...(fill ? { flex: 1, minHeight: 0 } : {}),
      }}>
      <View style={innerBase}>
        {Platform.OS === 'web' ? (
          children
        ) : (
          <>
            <BlurView
              pointerEvents="none"
              intensity={tabBar.blurIntensity}
              tint="dark"
              style={[absoluteFill, { borderRadius }]}
            />
            <View style={[{ position: 'relative', zIndex: 1 }, fill && { flex: 1, minHeight: 0 }]}>
              {children}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function TabBarFabButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ aspectRatio: 1, alignSelf: 'stretch', flexShrink: 0 }}>
      <TabBarSurface borderRadius={tabBar.shellRadius} fill>
        <View style={{ flex: 1, alignSelf: 'stretch', position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Додати нові показники"
            onPress={onPress}
            onPressIn={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={({ pressed }) => [
              absoluteFill,
              {
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor:
                  Platform.OS === 'web' ? tabBar.barFallbackBg : tabBar.barOverlay,
                opacity: pressed ? 0.92 : 1,
              },
            ]}>
            <MSIcon
              name="add"
              size={tabBar.fabAddIconSize}
              weight={300}
              iconColor={colors.butter}
            />
          </Pressable>
        </View>
      </TabBarSurface>
    </View>
  );
}

function TabItemContent({
  meta,
  fg,
}: {
  meta: { label: string; icon: IconName };
  fg: string;
}) {
  return (
    <View style={{ maxWidth: '100%', alignItems: 'center' }}>
      <MSIcon name={meta.icon} size={tabBar.iconSize} iconColor={fg} />
      <Text
        style={{
          ...typography.label,
          marginTop: spacing.xs,
          lineHeight: typography.label.fontSize + 3,
          color: fg,
          textAlign: 'center',
        }}
        numberOfLines={2}
        ellipsizeMode="tail">
        {meta.label}
      </Text>
    </View>
  );
}

function TabItem({
  meta,
  isFocused,
  onPress,
}: {
  meta: { label: string; icon: IconName };
  isFocused: boolean;
  onPress: () => void;
}) {
  const fg = isFocused ? tabBar.activeOnPill : colors.butter;
  const r = tabBar.activeRadius;

  return (
    <View style={{ flex: 1, flexBasis: 0, minWidth: 0, alignSelf: 'stretch' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        onPress={onPress}
        onPressIn={() => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
        style={({ pressed }) => ({
          flex: 1,
          minWidth: 0,
          justifyContent: 'center',
          opacity: pressed ? 0.92 : 1,
        })}>
        <View
          style={{
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.xs,
            borderRadius: r,
            backgroundColor: isFocused ? tabBar.activeSegmentBg : 'transparent',
            borderWidth: isFocused ? hairlineWidth : 0,
            borderColor: isFocused ? tabBar.activeSegmentBorder : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
          }}>
          <TabItemContent meta={meta} fg={fg} />
        </View>
      </Pressable>
    </View>
  );
}
