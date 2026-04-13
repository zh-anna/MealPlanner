import type { DayPlan, MacroTotals, Meal, MealType, MealsData } from '@/types/meals';

export function totalsForDay(day: DayPlan): MacroTotals {
  return {
    calories: day.breakfast.calories + day.lunch.calories + day.dinner.calories,
    protein: day.breakfast.protein + day.lunch.protein + day.dinner.protein,
    fat: day.breakfast.fat + day.lunch.fat + day.dinner.fat,
    carbs: day.breakfast.carbs + day.lunch.carbs + day.dinner.carbs,
  };
}

export function totalsWithReplacement(day: DayPlan, type: MealType, candidate: Meal): MacroTotals {
  const current = totalsForDay(day);
  const prev = day[type];
  return {
    calories: current.calories - prev.calories + candidate.calories,
    protein: current.protein - prev.protein + candidate.protein,
    fat: current.fat - prev.fat + candidate.fat,
    carbs: current.carbs - prev.carbs + candidate.carbs,
  };
}

export const REPLACE_MEAL_SLACK = {
  calories: 80,
  protein: 8,
  fat: 5,
  carbs: 12,
} as const;

export function fitsGoals(
  totals: MacroTotals,
  goals: MacroTotals,
  options?: {
    calorieSlack?: number;
    proteinSlack?: number;
    fatSlack?: number;
    carbsSlack?: number;
  },
): boolean {
  const calorieLimit = goals.calories + (options?.calorieSlack ?? 0);
  const proteinLimit = goals.protein + (options?.proteinSlack ?? 0);
  const fatLimit = goals.fat + (options?.fatSlack ?? 0);
  const carbsLimit = goals.carbs + (options?.carbsSlack ?? 0);
  return (
    totals.calories <= calorieLimit &&
    totals.protein <= proteinLimit &&
    totals.fat <= fatLimit &&
    totals.carbs <= carbsLimit
  );
}

export function getRandomMeal(meals: Meal[]) {
  return meals[Math.floor(Math.random() * meals.length)];
}

export function generateWeekMenu(days: string[], data: MealsData): DayPlan[] {
  return days.map((day) => ({
    day,
    breakfast: getRandomMeal(data.meals.breakfast),
    lunch: getRandomMeal(data.meals.lunch),
    dinner: getRandomMeal(data.meals.dinner),
  }));
}

const DEFAULT_MAX_ATTEMPTS_PER_DAY = 500;

export function generateWeekMenuRespectingGoals(
  days: string[],
  data: MealsData,
  maxAttemptsPerDay: number = DEFAULT_MAX_ATTEMPTS_PER_DAY,
): DayPlan[] {
  const goals = data.userGoals;
  return days.map((day) => {
    for (let attempt = 0; attempt < maxAttemptsPerDay; attempt++) {
      const breakfast = getRandomMeal(data.meals.breakfast);
      const lunch = getRandomMeal(data.meals.lunch);
      const dinner = getRandomMeal(data.meals.dinner);
      const plan: DayPlan = { day, breakfast, lunch, dinner };
      if (fitsGoals(totalsForDay(plan), goals)) {
        return plan;
      }
    }
    return generateWeekMenu([day], data)[0];
  });
}

export function findMealById(data: MealsData, id: string): Meal | undefined {
  for (const t of ['breakfast', 'lunch', 'dinner'] as const) {
    const m = data.meals[t].find((x) => x.id === id);
    if (m) return m;
  }
  return undefined;
}

