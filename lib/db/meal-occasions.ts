import type { MealType } from '@/types/meals';

export const MEAL_TYPE_TO_OCCASION_ID: Record<MealType, number> = {
  breakfast: 1,
  lunch: 2,
  dinner: 3,
};

export const OCCASION_ID_TO_MEAL_TYPE: Record<number, MealType> = {
  1: 'breakfast',
  2: 'lunch',
  3: 'dinner',
};
