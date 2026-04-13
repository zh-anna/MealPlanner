import { MEAL_TYPE_TO_OCCASION_ID } from '@/lib/db/meal-occasions';
import { findMealById, generateWeekMenuRespectingGoals } from '@/lib/meals';
import { supabase } from '@/lib/supabase';
import { WEEKDAY_LABELS_SHORT_UK } from '@/lib/week';
import type { DayPlan, Meal, MealType, MealsData } from '@/types/meals';

export type WeekPlanBundle = {
  weekStartIso: string;
  weekPlanId: string;
  menu: DayPlan[];
};

export type WeekPlanMealRow = {
  id: string;
  week_plan_id: string;
  day_index: number;
  day_label: string;
  meal_occasion_id: number;
  meal_id: string;
};

export function buildMenuFromSlotRows(rows: WeekPlanMealRow[], data: MealsData): DayPlan[] {
  const byDay: WeekPlanMealRow[][] = Array.from({ length: 7 }, () => []);
  for (const r of rows) {
    if (r.day_index >= 0 && r.day_index <= 6) byDay[r.day_index].push(r);
  }

  return WEEKDAY_LABELS_SHORT_UK.map((label, di) => {
    const slots = byDay[di];
    const byOcc = Object.fromEntries(slots.map((s) => [s.meal_occasion_id, s.meal_id])) as Record<
      number,
      string
    >;
    const bf = findMealById(data, byOcc[1]);
    const lu = findMealById(data, byOcc[2]);
    const diM = findMealById(data, byOcc[3]);
    if (!bf || !lu || !diM) {
      throw new Error(`Missing meal in catalog for day ${di}`);
    }
    return { day: label, breakfast: bf, lunch: lu, dinner: diM };
  });
}

export async function fetchOrCreateWeekMenu(
  userId: string,
  data: MealsData,
  weekStartIso: string,
): Promise<WeekPlanBundle> {
  const { data: existing, error: e1 } = await supabase
    .from('week_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartIso)
    .maybeSingle();

  if (e1) throw e1;

  if (existing?.id) {
    const { data: slots, error: e2 } = await supabase
      .from('week_plan_meals')
      .select('id, week_plan_id, day_index, day_label, meal_occasion_id, meal_id')
      .eq('week_plan_id', existing.id);

    if (e2) throw e2;
    if (!slots?.length) {
      const seeded = await seedWeekPlanSlots(existing.id, data);
      return { weekStartIso, weekPlanId: seeded.weekPlanId, menu: seeded.menu };
    }
    const menu = buildMenuFromSlotRows(slots as WeekPlanMealRow[], data);
    return { weekStartIso, weekPlanId: existing.id, menu };
  }

  const { data: created, error: e3 } = await supabase
    .from('week_plans')
    .insert({ user_id: userId, week_start_date: weekStartIso })
    .select('id')
    .single();

  if (e3) throw e3;
  const seeded = await seedWeekPlanSlots(created.id, data);
  return { weekStartIso, weekPlanId: seeded.weekPlanId, menu: seeded.menu };
}

export async function fetchExistingWeekMenu(
  userId: string,
  data: MealsData,
  weekStartIso: string,
): Promise<WeekPlanBundle | null> {
  const { data: existing, error: e1 } = await supabase
    .from('week_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartIso)
    .maybeSingle();

  if (e1) throw e1;
  if (!existing?.id) return null;

  const { data: slots, error: e2 } = await supabase
    .from('week_plan_meals')
    .select('id, week_plan_id, day_index, day_label, meal_occasion_id, meal_id')
    .eq('week_plan_id', existing.id);

  if (e2) throw e2;
  if (!slots?.length) return null;

  const menu = buildMenuFromSlotRows(slots as WeekPlanMealRow[], data);
  return { weekStartIso, weekPlanId: existing.id, menu };
}

export async function listUserWeekPlanStarts(userId: string, limit = 24): Promise<string[]> {
  const { data, error } = await supabase
    .from('week_plans')
    .select('week_start_date')
    .eq('user_id', userId)
    .order('week_start_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((r) => r.week_start_date as string);
}

async function seedWeekPlanSlots(
  weekPlanId: string,
  data: MealsData,
): Promise<{ weekPlanId: string; menu: DayPlan[] }> {
  const labels = [...WEEKDAY_LABELS_SHORT_UK];
  const menu = generateWeekMenuRespectingGoals(labels, data);

  const rows: {
    week_plan_id: string;
    day_index: number;
    day_label: string;
    meal_occasion_id: number;
    meal_id: string;
  }[] = [];

  menu.forEach((dayPlan, di) => {
    rows.push(
      {
        week_plan_id: weekPlanId,
        day_index: di,
        day_label: dayPlan.day,
        meal_occasion_id: 1,
        meal_id: dayPlan.breakfast.id,
      },
      {
        week_plan_id: weekPlanId,
        day_index: di,
        day_label: dayPlan.day,
        meal_occasion_id: 2,
        meal_id: dayPlan.lunch.id,
      },
      {
        week_plan_id: weekPlanId,
        day_index: di,
        day_label: dayPlan.day,
        meal_occasion_id: 3,
        meal_id: dayPlan.dinner.id,
      },
    );
  });

  const { error } = await supabase.from('week_plan_meals').insert(rows);
  if (error) throw error;

  return { weekPlanId, menu };
}

export async function updateWeekPlanMealRemote(params: {
  userId: string;
  weekPlanId: string;
  dayIndex: number;
  type: MealType;
  previousMeal: Meal;
  nextMeal: Meal;
}): Promise<void> {
  const occasionId = MEAL_TYPE_TO_OCCASION_ID[params.type];

  const { error: uErr } = await supabase
    .from('week_plan_meals')
    .update({ meal_id: params.nextMeal.id })
    .eq('week_plan_id', params.weekPlanId)
    .eq('day_index', params.dayIndex)
    .eq('meal_occasion_id', occasionId);

  if (uErr) throw uErr;

  const { error: lErr } = await supabase.from('meal_replacement_events').insert({
    user_id: params.userId,
    week_plan_id: params.weekPlanId,
    day_index: params.dayIndex,
    meal_occasion_id: occasionId,
    from_meal_id: params.previousMeal.id,
    to_meal_id: params.nextMeal.id,
  });

  if (lErr) throw lErr;
}
