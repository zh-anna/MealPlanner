import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { calendarDateKeyLocal, weekdayIndexMondayFirst } from '@/lib/week';
import { useMealPlanStore } from '@/stores/use-meal-plan-store';

export default function TabLayout() {
  const lastCalendarKey = useRef(calendarDateKeyLocal());

  // Після півночі або довгого sleep: вирівняти selectedDay з календарем (меню persist не зберігає день).
  useEffect(() => {
    const syncSelectedDayIfDateChanged = () => {
      const now = new Date();
      const key = calendarDateKeyLocal(now);
      if (key !== lastCalendarKey.current) {
        lastCalendarKey.current = key;
        useMealPlanStore.setState({ selectedDay: weekdayIndexMondayFirst(now) });
      }
    };

    syncSelectedDayIfDateChanged();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncSelectedDayIfDateChanged();
    });
    return () => sub.remove();
  }, []);

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Розклад' }} />
      <Tabs.Screen name="shopping" options={{ title: 'Покупки' }} />
      <Tabs.Screen name="stats" options={{ title: 'Статистика' }} />
    </Tabs>
  );
}
