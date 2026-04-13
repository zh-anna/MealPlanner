import { OCCASION_ID_TO_MEAL_TYPE } from '@/lib/db/meal-occasions';
import type { Ingredient, Meal } from '@/types/meals';

export type MealIngredientRow = {
  sort_order: number;
  quantity: number | string;
  unit: string;
  grams: number | string | null;
  note: string | null;
  ingredients: { id: string; name: string } | null;
};

export type MealRow = {
  id: string;
  meal_occasion_id: number;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  meal_ingredients?: MealIngredientRow[] | null;
};

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapIngredients(rows: MealIngredientRow[] | null | undefined): Ingredient[] {
  if (!rows?.length) return [];
  return [...rows]
    .sort((a, b) => num(a.sort_order) - num(b.sort_order))
    .map((r) => {
      const name = r.ingredients?.name ?? '';
      const unit = r.unit || 'г';
      const amount = num(r.quantity);
      const g = r.grams != null ? num(r.grams) : null;
      return {
        ingredientId: r.ingredients?.id ?? '',
        name,
        amount,
        unit,
        grams: unit === 'г' ? amount : g,
        note: r.note ?? undefined,
      };
    });
}

export function dbRowToMeal(row: MealRow): Meal {
  const type = OCCASION_ID_TO_MEAL_TYPE[row.meal_occasion_id];
  if (!type) throw new Error(`Unknown meal_occasion_id ${row.meal_occasion_id}`);
  return {
    id: row.id,
    type,
    name: row.name,
    calories: row.calories,
    protein: row.protein,
    fat: row.fat,
    carbs: row.carbs,
    ingredients: mapIngredients(row.meal_ingredients),
  };
}
