import { useMemo } from 'react';
import { router } from 'expo-router';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { Card } from '@/components/ui/card';
import { MSIcon } from '@/components/ui/ms-icon';
import { Stat } from '@/components/ui/stat';
import { UIText } from '@/components/ui/ui-text';
import { totalsForDay } from '@/lib/meals';
import { dateForDayInWeek, isoMondayToLocalDate } from '@/lib/week';
import { useMealPlanStore } from '@/stores/use-meal-plan-store';
import type { Ingredient, MealType } from '@/types/meals';

function formatIngredientLine(ing: Ingredient): string {
  if (ing.unit === 'г') return `${ing.amount} г`;
  return `${ing.amount} ${ing.unit}`;
}

export default function WeekScreen() {
  const insets = useSafeAreaInsets();
  const weekPickerStarts = useMealPlanStore((s) => s.weekPickerStarts);
  const activeWeekStartIso = useMealPlanStore((s) => s.activeWeekStartIso);
  const weeks = useMealPlanStore((s) => s.weeks);
  const selectScheduleSlot = useMealPlanStore((s) => s.selectScheduleSlot);
  const selectedDay = useMealPlanStore((s) => s.selectedDay);

  const bundle = weeks[activeWeekStartIso];
  const menu = bundle?.menu ?? [];

  const daySlots = useMemo(() => {
    const out: { weekStartIso: string; dayIndex: number }[] = [];
    for (const iso of weekPickerStarts) {
      const m = weeks[iso]?.menu;
      if (!m?.length) continue;
      for (let d = 0; d < m.length; d++) {
        out.push({ weekStartIso: iso, dayIndex: d });
      }
    }
    return out;
  }, [weekPickerStarts, weeks]);

  const dayPlan = menu[selectedDay];
  const totals = dayPlan ? totalsForDay(dayPlan) : { calories: 0, protein: 0, fat: 0, carbs: 0 };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <ScreenHeader
        title="Розклад"
        subtitle="Розклад харчування на тиждень."
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-lg shrink-0 grow-0 pl-lg pt-md"
        style={{ flexGrow: 0, flexShrink: 0, overflow: 'visible' }}
        contentContainerClassName="gap-sm pr-lg items-start"
        contentContainerStyle={{ overflow: 'visible' }}>
        {daySlots.map(({ weekStartIso, dayIndex }) => {
          const m = weeks[weekStartIso]?.menu?.[dayIndex];
          if (!m) return null;
          const mon = isoMondayToLocalDate(weekStartIso);
          const date = dateForDayInWeek(dayIndex, mon);
          const sel = weekStartIso === activeWeekStartIso && dayIndex === selectedDay;
          return (
            <TouchableOpacity
              key={`${weekStartIso}-${dayIndex}`}
              onPress={() => void selectScheduleSlot(weekStartIso, dayIndex)}
              className={[
                'self-start rounded-md px-md py-sm',
                sel ? 'bg-brand-lime' : 'bg-bg-surfaceHigh border border-border-subtle',
              ].join(' ')}>
              <View className="items-center">
                <UIText
                  tone={sel ? 'butter' : 'secondary'}
                  variant="bodyMedium"
                  className="text-[14px] leading-[18px]">
                  {m.day}
                </UIText>
                <UIText tone={sel ? 'butter' : 'muted'} variant="label" className="mt-[2px]">
                  {date.getDate()}
                </UIText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        className="flex-1 px-lg"
        contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
        <Card className="mb-md flex-row justify-between">
          {[
            { label: 'Калорії', value: totals.calories, unit: 'ккал' },
            { label: 'Білки', value: totals.protein, unit: 'г' },
            { label: 'Жири', value: totals.fat, unit: 'г' },
            { label: 'Вуглев', value: totals.carbs, unit: 'г' },
          ].map((item) => (
            <Stat key={item.label} label={item.label} value={`${item.value}${item.unit}`} />
          ))}
        </Card>

        {(
          [
            { label: 'Сніданок', icon: 'restaurant' as const, type: 'breakfast' as const, meal: dayPlan?.breakfast },
            { label: 'Обід', icon: 'wb_sunny' as const, type: 'lunch' as const, meal: dayPlan?.lunch },
            { label: 'Вечеря', icon: 'dark_mode' as const, type: 'dinner' as const, meal: dayPlan?.dinner },
          ] as const
        ).map(({ label, icon, type, meal }) => (
          <Card key={label} className="mb-sm">
            <View className="flex-row items-start justify-between">
              <View className="mb-xs flex-row items-center gap-xs">
                <MSIcon name={icon} tone="brand" size={18} />
                <UIText tone="brand" variant="label">
                  {label}
                </UIText>
              </View>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/replace-meal',
                    params: {
                      day: String(selectedDay),
                      type: type as MealType,
                      weekStart: activeWeekStartIso,
                    },
                  })
                }
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Замінити страву">
                <MSIcon name="swap_horiz" tone="muted" size={24} />
              </TouchableOpacity>
            </View>
            {meal ? (
              <>
                <View className="pr-md">
                  <UIText variant="bodyBold">{meal.name}</UIText>
                  <UIText tone="muted" variant="caption" className="mt-xs">
                    {meal.calories} ккал · Б {meal.protein}г · Ж {meal.fat}г · В {meal.carbs}г
                  </UIText>
                </View>
                <View className="mt-sm border-t border-border-subtle pt-sm">
                  {meal.ingredients.map((ing) => (
                    <View
                      key={`${meal.id}:${ing.ingredientId}:${ing.name}:${ing.amount}${ing.unit}`}
                      className="flex-row">
                      <UIText tone="secondary" variant="caption" className="flex-1">
                        {ing.name}
                        {ing.note ? ` (${ing.note})` : ''}
                      </UIText>
                      <UIText tone="secondary" variant="caption">
                        {formatIngredientLine(ing)}
                      </UIText>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
