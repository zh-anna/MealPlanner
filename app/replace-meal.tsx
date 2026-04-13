import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { twMerge } from 'tailwind-merge';
import { Card } from '@/components/ui/card';
import { MSIcon } from '@/components/ui/ms-icon';
import { UIText } from '@/components/ui/ui-text';
import { fitsGoals, REPLACE_MEAL_SLACK, totalsWithReplacement } from '@/lib/meals';
import { dateForDayInWeek, isoMondayToLocalDate } from '@/lib/week';
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

function asWeekStart(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
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
        <View className="relative min-h-[72px] flex-1 pr-sm">
          {isCurrent ? (
            <View className="absolute left-0 top-0 z-10">
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

        <View className="ml-sm w-[96px] items-center justify-center self-stretch border-l border-border-subtle pl-md">
          <UIText tone="secondary" variant="label" className="mb-xs text-center">
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

  const calendarWeekStartIso = useMealPlanStore((s) => s.calendarWeekStartIso);
  const weekStartIso = asWeekStart(params.weekStart, calendarWeekStartIso);
  const data = useMealPlanStore((s) => s.data);
  const weeks = useMealPlanStore((s) => s.weeks);
  const replaceMeal = useMealPlanStore((s) => s.replaceMeal);

  const menu = weeks[weekStartIso]?.menu ?? [];
  const day = menu[dayIndex];
  const goals = data?.userGoals;

  const weekMonday = isoMondayToLocalDate(weekStartIso);
  const dayDate = dateForDayInWeek(dayIndex, weekMonday);

  if (!data || goals == null) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-canvas px-lg">
        <UIText variant="bodyMedium">Завантаження…</UIText>
      </View>
    );
  }

  if (!day) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-canvas px-lg">
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

  if (!currentMeal?.id) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-canvas px-lg">
        <UIText variant="bodyBold">Немає поточної страви</UIText>
        <TouchableOpacity onPress={() => router.back()} className="mt-md">
          <UIText tone="brand" variant="bodyBold">
            Закрити
          </UIText>
        </TouchableOpacity>
      </View>
    );
  }

  const fittingCandidates = candidates.filter((m) =>
    fitsGoals(totalsWithReplacement(day, type, m), goals, {
      calorieSlack: REPLACE_MEAL_SLACK.calories,
      proteinSlack: REPLACE_MEAL_SLACK.protein,
      fatSlack: REPLACE_MEAL_SLACK.fat,
      carbsSlack: REPLACE_MEAL_SLACK.carbs,
    }),
  );
  const otherMeals = fittingCandidates.filter((m) => m.id !== currentMeal.id);

  const titleByType: Record<MealType, string> = {
    breakfast: 'Замінити сніданок',
    lunch: 'Замінити обід',
    dinner: 'Замінити вечерю',
  };

  return (
    <View className="flex-1 overflow-hidden rounded-t-md bg-bg-canvas pt-xxl">
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
                  void replaceMeal({ dayIndex, type, meal: m, weekStartIso })
                    .then(() => router.back())
                    .catch(() => undefined);
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
