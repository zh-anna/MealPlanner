import { useEffect, type ReactNode } from 'react';
import { AppState, Pressable, View } from 'react-native';

import { UIText } from '@/components/ui/ui-text';
import { colors } from '@/constants/tokens';
import { useBodyStatsStore } from '@/stores/use-body-stats-store';
import { useMealPlanStore } from '@/stores/use-meal-plan-store';

type Props = {
  fontsLoaded: boolean;
  children: ReactNode;
};

export function AppDataGate({ fontsLoaded, children }: Props) {
  const status = useMealPlanStore((s) => s.status);
  const error = useMealPlanStore((s) => s.error);
  const bootstrap = useMealPlanStore((s) => s.bootstrap);
  const refreshWeek = useMealPlanStore((s) => s.refreshWeek);
  const refreshProfile = useMealPlanStore((s) => s.refreshProfile);
  const loadBody = useBodyStatsStore((s) => s.load);

  useEffect(() => {
    if (!fontsLoaded) return;
    void (async () => {
      await bootstrap();
      await loadBody().catch(() => undefined);
    })();
  }, [fontsLoaded, bootstrap, loadBody]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshWeek();
        void refreshProfile();
        void loadBody().catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, [refreshWeek, refreshProfile, loadBody]);

  if (!fontsLoaded) return null;

  if (status === 'idle' || status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, justifyContent: 'center', padding: 24 }}>
        <UIText variant="bodyMedium" className="text-center">
          Завантаження даних…
        </UIText>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, justifyContent: 'center', padding: 24 }}>
        <UIText variant="bodyBold" className="text-center mb-md">
          Не вдалося синхронізувати
        </UIText>
        <UIText tone="secondary" variant="caption" className="text-center mb-lg">
          {error ?? 'Невідома помилка'}
        </UIText>
        <Pressable
          onPress={() => void bootstrap()}
          className="self-center rounded-md bg-brand-yellow px-lg py-md active:opacity-90">
          <UIText variant="bodyBold">Спробувати знову</UIText>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}
