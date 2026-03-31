export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type Ingredient = {
  name: string;
  amount: number;
  unit: string;
  note?: string;
};

export type Meal = {
  id: string;
  name: string;
  type: MealType;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  ingredients: Ingredient[];
};

export type MacroTotals = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type DayPlan = {
  day: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
};

export type MealsData = {
  userGoals: MacroTotals;
  meals: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
  };
};

