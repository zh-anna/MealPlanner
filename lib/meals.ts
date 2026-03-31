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

export function fitsGoals(totals: MacroTotals, goals: MacroTotals): boolean {
  return (
    totals.calories <= goals.calories &&
    totals.protein <= goals.protein &&
    totals.fat <= goals.fat &&
    totals.carbs <= goals.carbs
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

