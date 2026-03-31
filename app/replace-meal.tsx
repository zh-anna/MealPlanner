import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Card } from '@/components/ui/card';
import { MSIcon } from '@/components/ui/ms-icon';
import { UIText } from '@/components/ui/ui-text';
import { fitsGoals, totalsWithReplacement } from '@/lib/meals';
import { dateForWeekDayIndex } from '@/lib/week';
import { useMealPlanStore } from '@/stores/use-meal-plan-store';
import type { DayPlan, Meal, MealType } from '@/types/meals';

function asMealType(value: unknown): MealType {
  if (value === 'breakfast' || value === 'lunch' || value === 'dinner') return value;
  return 'breakfast';
}

function asDayIndex(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function MealReplaceCard({
  m,
  day,
  type,
  isCurrent,
}: {
  m: Meal;
  day: DayPlan;
  type: MealType;
  isCurrent: boolean;
}) {
  const nextTotals = totalsWithReplacement(day, type, m);

  return (
    <Card
      className={twMerge(
        isCurrent ? 'border-border-pink bg-bg-pink' : 'bg-bg-surface border-border-subtle',
        'overflow-hidden',
      )}>
      <View className="flex-row items-stretch">
        <View className="flex-1 pr-sm relative min-h-[72px]">
          {isCurrent ? (
            <View className="absolute left-0 z-10 top-0">
              <UIText tone="pink" variant="label">
                Поточна
              </UIText>
            </View>
          ) : null}
          <View className={isCurrent ? 'pt-xl' : ''}>
            <UIText variant="bodyBold">{m.name}</UIText>
            <UIText tone="muted" variant="caption" className="mt-xs">
              {m.calories} ккал · Б {m.protein} · Ж {m.fat} · В {m.carbs}
            </UIText>
          </View>
        </View>

        <View className="w-[96px] items-center justify-center self-stretch border-l border-border-subtle pl-md ml-sm">
          <UIText tone="secondary" variant="label" className="text-center mb-xs">
            Тотал ккал
          </UIText>
          <UIText tone="brand" variant="bodyBold" className="text-center">
            {nextTotals.calories}
          </UIText>
          <UIText tone="muted" variant="caption" className="text-center">
            за день
          </UIText>
        </View>
      </View>
    </Card>
  );
}

export default function ReplaceMealModal() {
  const params = useLocalSearchParams();
  const dayIndex = asDayIndex(params.day);
  const type = asMealType(params.type);

  const { data, menu, replaceMeal } = useMealPlanStore();
  const day = menu[dayIndex];
  const goals = data.userGoals;

  if (!day) {
    return (
      <View className="flex-1 bg-bg-canvas items-center justify-center px-lg">
        <UIText variant="bodyBold">Невірний день</UIText>
        <TouchableOpacity onPress={() => router.back()} className="mt-md">
          <UIText tone="brand" variant="bodyBold">
            Закрити
          </UIText>
        </TouchableOpacity>
      </View>
    );
  }

  const currentMeal = day[type];
  const candidates = data.meals[type];
  const dayDate = dateForWeekDayIndex(dayIndex);

  const fittingCandidates = candidates.filter((m) =>
    fitsGoals(totalsWithReplacement(day, type, m), goals),
  );
  const otherMeals = fittingCandidates.filter((m) => m.id !== currentMeal.id);

  const titleByType: Record<MealType, string> = {
    breakfast: 'Замінити сніданок',
    lunch: 'Замінити обід',
    dinner: 'Замінити вечерю',
  };

  return (
    <View className="flex-1 bg-bg-canvas pt-xxl overflow-hidden rounded-t-md">
      <View className="px-lg pb-md">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-md">
            <UIText variant="h3">
              {titleByType[type]} для {day.day}, {dayDate.getDate()}
            </UIText>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <MSIcon name="close" tone="secondary" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {fittingCandidates.length === 0 ? (
        <ScrollView className="flex-1 px-lg" contentContainerClassName="pb-xxl">
          <MealReplaceCard m={currentMeal} day={day} type={type} isCurrent />
          <Card className="mb-sm mt-md">
            <UIText variant="bodyMedium">Немає страв, що вписуються в цілі КБЖУ на цей день.</UIText>
            <UIText tone="muted" variant="caption" className="mt-xs">
              Спробуй інший прийом їжі або онови тижневе меню.
            </UIText>
          </Card>
        </ScrollView>
      ) : (
        <>
          <View className="shrink-0 px-lg pb-md">
            <MealReplaceCard m={currentMeal} day={day} type={type} isCurrent />
          </View>

          <ScrollView className="flex-1 px-lg" contentContainerClassName="pb-xxl">
            {otherMeals.map((m: Meal) => (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.7}
                onPress={() => {
                  replaceMeal(dayIndex, type, m);
                  router.back();
                }}
                className="mb-sm">
                <MealReplaceCard m={m} day={day} type={type} isCurrent={false} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
}
