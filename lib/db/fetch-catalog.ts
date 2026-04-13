import { dbRowToMeal, type MealRow } from '@/lib/db/map-meal-row';
import { supabase } from '@/lib/supabase';
import type { MacroTotals, MealsData } from '@/types/meals';

export const DEFAULT_MACRO_GOALS: MacroTotals = {
  calories: 1300,
  protein: 85,
  fat: 50,
  carbs: 120,
};

export async function fetchMealsCatalogAndGoals(userId: string): Promise<MealsData> {
  const { data: goalRow, error: gErr } = await supabase
    .from('user_macro_goals')
    .select('calories, protein, fat, carbs')
    .eq('user_id', userId)
    .maybeSingle();

  if (gErr) throw gErr;

  let userGoals: MacroTotals = goalRow
    ? {
        calories: goalRow.calories,
        protein: goalRow.protein,
        fat: goalRow.fat,
        carbs: goalRow.carbs,
      }
    : DEFAULT_MACRO_GOALS;

  if (!goalRow) {
    const { error: insErr } = await supabase.from('user_macro_goals').upsert(
      {
        user_id: userId,
        calories: userGoals.calories,
        protein: userGoals.protein,
        fat: userGoals.fat,
        carbs: userGoals.carbs,
      },
      { onConflict: 'user_id' },
    );
    if (insErr) throw insErr;
  }

  const { data: rows, error: mErr } = await supabase
    .from('meals')
    .select(
      `id, meal_occasion_id, name, calories, protein, fat, carbs,
       meal_ingredients (
         sort_order,
         quantity,
         unit,
         grams,
         note,
         ingredients ( id, name )
       )`,
    )
    .eq('is_active', true);

  if (mErr) throw mErr;

  const meals = (rows ?? []) as unknown as MealRow[];
  const breakfast = meals.filter((r) => r.meal_occasion_id === 1).map(dbRowToMeal);
  const lunch = meals.filter((r) => r.meal_occasion_id === 2).map(dbRowToMeal);
  const dinner = meals.filter((r) => r.meal_occasion_id === 3).map(dbRowToMeal);

  return {
    userGoals,
    meals: { breakfast, lunch, dinner },
  };
}
