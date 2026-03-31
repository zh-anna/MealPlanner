import { router } from 'expo-router';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { MSIcon } from '@/components/ui/ms-icon';
import { Stat } from '@/components/ui/stat';
import { UIText } from '@/components/ui/ui-text';
import { totalsForDay } from '@/lib/meals';
import { dateForWeekDayIndex } from '@/lib/week';
import { useMealPlanStore } from '@/stores/use-meal-plan-store';
import type { MealType } from '@/types/meals';

export default function WeekScreen() {
  const insets = useSafeAreaInsets();
  const { menu, selectedDay, setSelectedDay } = useMealPlanStore();

  const dayPlan = menu[selectedDay];
  const totals = dayPlan ? totalsForDay(dayPlan) : { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const weekDates = menu.map((_, idx) => dateForWeekDayIndex(idx));

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <UIText variant="h2" className="px-lg pt-xl">
        Розклад
      </UIText>
      <UIText tone="secondary" variant="caption" className="mt-xs px-lg">
        Розклад харчування на тиждень
      </UIText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-lg shrink-0 grow-0 pl-lg pt-md"
        style={{ flexGrow: 0, flexShrink: 0 }}
        contentContainerClassName="gap-sm pr-lg items-start">
        {menu.map((item, index) => (
          <TouchableOpacity
            key={item.day}
            onPress={() => setSelectedDay(index)}
            className={[
              'self-start rounded-md px-md py-sm',
              selectedDay === index ? 'bg-brand-yellow' : 'bg-bg-surfaceHigh border border-border-subtle',
            ].join(' ')}>
            <View className="items-center">
              <UIText
                tone={selectedDay === index ? 'inverse' : 'secondary'}
                variant="bodyMedium"
                className="text-[14px] leading-[18px]">
                {item.day}
              </UIText>
              <UIText tone={selectedDay === index ? 'inverse' : 'muted'} variant="label" className="mt-[2px]">
                {weekDates[index]?.getDate()}
              </UIText>
            </View>
          </TouchableOpacity>
        ))}
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
                    params: { day: String(selectedDay), type: type satisfies MealType },
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
                    <View key={`${meal.id}:${ing.name}:${ing.amount}${ing.unit}`} className="flex-row">
                      <UIText tone="secondary" variant="caption" className="flex-1">
                        {ing.name}
                        {ing.note ? ` (${ing.note})` : ''}
                      </UIText>
                      <UIText tone="secondary" variant="caption">
                        {ing.amount} {ing.unit}
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
