import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import mealsJson from '@/data/meals.json';
import { generateWeekMenu } from '@/lib/meals';
import { weekdayIndexMondayFirst, WEEKDAY_LABELS_SHORT_UK } from '@/lib/week';
import type { DayPlan, Meal, MealType, MealsData } from '@/types/meals';

const DATA = mealsJson as MealsData;

function isValidMenu(menu: unknown): menu is DayPlan[] {
  if (!Array.isArray(menu) || menu.length !== WEEKDAY_LABELS_SHORT_UK.length) return false;
  return menu.every(
    (d) =>
      d &&
      typeof d === 'object' &&
      typeof (d as DayPlan).day === 'string' &&
      (d as DayPlan).breakfast &&
      (d as DayPlan).lunch &&
      (d as DayPlan).dinner,
  );
}

type State = {
  data: MealsData;
  menu: DayPlan[];
  selectedDay: number;
};

type Actions = {
  setSelectedDay: (index: number) => void;
  replaceMeal: (dayIndex: number, type: MealType, meal: Meal) => void;
};

type PersistedSlice = Pick<State, 'menu'>;

export const useMealPlanStore = create<State & Actions>()(
  persist(
    (set) => ({
      data: DATA,
      menu: generateWeekMenu([...WEEKDAY_LABELS_SHORT_UK], DATA),
      selectedDay: weekdayIndexMondayFirst(),
      setSelectedDay: (index) => set({ selectedDay: index }),
      replaceMeal: (dayIndex, type, meal) =>
        set((s) => ({
          menu: s.menu.map((d, idx) =>
            idx === dayIndex ? { ...d, [type]: meal } : d,
          ),
        })),
    }),
    {
      name: 'mealplanner-meal-plan',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      partialize: (state): PersistedSlice => ({
        menu: state.menu,
      }),
      migrate: (persisted): PersistedSlice => {
        const p = persisted as Partial<PersistedSlice> & { selectedDay?: number };
        return {
          menu: isValidMenu(p.menu) ? p.menu : generateWeekMenu([...WEEKDAY_LABELS_SHORT_UK], DATA),
        };
      },
      merge: (persisted, current): State & Actions => {
        const next = { ...current, data: DATA };
        if (!persisted || typeof persisted !== 'object') {
          return { ...next, selectedDay: weekdayIndexMondayFirst() };
        }
        const p = persisted as Partial<PersistedSlice>;
        const menu = isValidMenu(p.menu)
          ? p.menu
          : isValidMenu(next.menu)
            ? next.menu
            : generateWeekMenu([...WEEKDAY_LABELS_SHORT_UK], DATA);
        return { ...next, menu, selectedDay: weekdayIndexMondayFirst() };
      },
    },
  ),
);
