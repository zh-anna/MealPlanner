import { create } from 'zustand';

import { fetchMealsCatalogAndGoals } from '@/lib/db/fetch-catalog';
import { getNextAccumulatedWeekStartIso } from '@/lib/db/accumulated-week';
import {
  fetchExistingWeekMenu,
  fetchOrCreateWeekMenu,
  listUserWeekPlanStarts,
  updateWeekPlanMealRemote,
  type WeekPlanBundle,
} from '@/lib/db/week-plan-sync';
import { ensureSharedUserSession } from '@/lib/auth/shared-sign-in';
import { fetchProfile } from '@/lib/db/profile-sync';
import { calendarDateKeyLocal, getCurrentWeekStartMonday, weekdayIndexMondayFirst } from '@/lib/week';
import type { DayPlan, Meal, MealType, MealsData } from '@/types/meals';

type SyncStatus = 'idle' | 'loading' | 'ready' | 'error';

export type { WeekPlanBundle };

type State = {
  userId: string | null;
  data: MealsData | null;
  weeks: Record<string, WeekPlanBundle>;
  calendarWeekStartIso: string;
  activeWeekStartIso: string;
  weekPickerStarts: string[];
  selectedDay: number;
  status: SyncStatus;
  error: string | null;
  profileAvatarUrl: string | null;
};

type Actions = {
  bootstrap: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfileAvatarUrl: (url: string | null) => void;
  refreshWeek: () => Promise<void>;
  generateNextWeek: () => Promise<void>;
  setActiveWeekStart: (weekStartIso: string) => Promise<void>;
  selectScheduleSlot: (weekStartIso: string, dayIndex: number) => Promise<void>;
  setSelectedDay: (index: number) => void;
  replaceMeal: (params: {
    dayIndex: number;
    type: MealType;
    meal: Meal;
    weekStartIso: string;
  }) => Promise<void>;
};

function uniqSorted(isos: string[]): string[] {
  return [...new Set(isos)].sort((a, b) => a.localeCompare(b));
}

function computeCalendarWeekStartIso(d = new Date()): string {
  return calendarDateKeyLocal(getCurrentWeekStartMonday(d));
}

export const useMealPlanStore = create<State & Actions>((set, get) => ({
  userId: null,
  data: null,
  weeks: {},
  calendarWeekStartIso: computeCalendarWeekStartIso(),
  activeWeekStartIso: computeCalendarWeekStartIso(),
  weekPickerStarts: [],
  selectedDay: weekdayIndexMondayFirst(),
  status: 'idle',
  error: null,
  profileAvatarUrl: null,

  bootstrap: async () => {
    set({ status: 'loading', error: null });
    try {
      const { userId } = await ensureSharedUserSession();
      const data = await fetchMealsCatalogAndGoals(userId);
      const profile = await fetchProfile(userId).catch(() => null);
      const now = new Date();
      const calIso = computeCalendarWeekStartIso(now);
      const weeks: Record<string, WeekPlanBundle> = { ...get().weeks };

      const current = await fetchOrCreateWeekMenu(userId, data, calIso);
      weeks[current.weekStartIso] = current;

      let picker = await listUserWeekPlanStarts(userId, 40);
      picker = uniqSorted([...picker, ...Object.keys(weeks)]);

      set({
        userId,
        data,
        weeks,
        calendarWeekStartIso: calIso,
        activeWeekStartIso: calIso,
        weekPickerStarts: picker,
        selectedDay: weekdayIndexMondayFirst(now),
        status: 'ready',
        error: null,
        profileAvatarUrl: profile?.avatarUrl ?? null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ status: 'error', error: msg });
    }
  },

  refreshProfile: async () => {
    const { userId } = get();
    if (!userId) return;
    try {
      const p = await fetchProfile(userId);
      if (p == null) return;
      set({ profileAvatarUrl: p.avatarUrl ?? null });
    } catch {}
  },

  setProfileAvatarUrl: (url) => set({ profileAvatarUrl: url }),

  refreshWeek: async () => {
    const { userId, data } = get();
    if (!userId || !data) return;
    try {
      const now = new Date();
      const calIso = computeCalendarWeekStartIso(now);
      const weeks: Record<string, WeekPlanBundle> = { ...get().weeks };

      weeks[calIso] = await fetchOrCreateWeekMenu(userId, data, calIso);

      let picker = await listUserWeekPlanStarts(userId, 40);
      picker = uniqSorted([...picker, ...Object.keys(weeks)]);

      const prev = get();
      const nextActive =
        prev.activeWeekStartIso === prev.calendarWeekStartIso ? calIso : prev.activeWeekStartIso;

      set({
        weeks,
        calendarWeekStartIso: calIso,
        weekPickerStarts: picker,
        activeWeekStartIso: nextActive,
        selectedDay:
          nextActive === calIso ? weekdayIndexMondayFirst(now) : prev.selectedDay,
      });
    } catch {}
  },

  generateNextWeek: async () => {
    const { userId, data } = get();
    if (!userId || !data) return;
    try {
      const nextIso = await getNextAccumulatedWeekStartIso(userId);
      const bundle = await fetchOrCreateWeekMenu(userId, data, nextIso);
      const prev = get();
      const picker = uniqSorted([...prev.weekPickerStarts, bundle.weekStartIso]);
      set({
        weeks: { ...prev.weeks, [bundle.weekStartIso]: bundle },
        weekPickerStarts: picker,
        activeWeekStartIso: bundle.weekStartIso,
        selectedDay: 0,
      });
    } catch {}
  },

  setActiveWeekStart: async (weekStartIso) => {
    const { userId, data, weeks, calendarWeekStartIso } = get();
    if (!userId || !data) return;

    const dayForWeek =
      weekStartIso === calendarWeekStartIso ? weekdayIndexMondayFirst(new Date()) : 0;

    if (weeks[weekStartIso]) {
      set({ activeWeekStartIso: weekStartIso, selectedDay: dayForWeek });
      return;
    }

    const loaded = await fetchExistingWeekMenu(userId, data, weekStartIso);
    if (loaded) {
      set({
        weeks: { ...weeks, [weekStartIso]: loaded },
        activeWeekStartIso: weekStartIso,
        selectedDay: dayForWeek,
      });
    }
  },

  selectScheduleSlot: async (weekStartIso, dayIndex) => {
    const { userId, data, weeks } = get();
    if (!userId || !data) return;
    const idx = Math.max(0, Math.min(6, dayIndex));

    if (weeks[weekStartIso]) {
      set({ activeWeekStartIso: weekStartIso, selectedDay: idx });
      return;
    }

    const loaded = await fetchExistingWeekMenu(userId, data, weekStartIso);
    if (loaded) {
      set({
        weeks: { ...get().weeks, [weekStartIso]: loaded },
        activeWeekStartIso: weekStartIso,
        selectedDay: idx,
      });
    }
  },

  setSelectedDay: (index) => set({ selectedDay: index }),

  replaceMeal: async ({ dayIndex, type, meal, weekStartIso }) => {
    const { userId, data, weeks } = get();
    const bundle = weeks[weekStartIso];
    if (!userId || !data || !bundle) return;

    const menu = bundle.menu;
    const day = menu[dayIndex];
    if (!day) return;
    const previousMeal = day[type];
    if (!previousMeal?.id) return;

    const nextMenu = menu.map((d, idx) => (idx === dayIndex ? { ...d, [type]: meal } : d));
    set({
      weeks: {
        ...weeks,
        [weekStartIso]: { ...bundle, menu: nextMenu },
      },
    });

    try {
      await updateWeekPlanMealRemote({
        userId,
        weekPlanId: bundle.weekPlanId,
        dayIndex,
        type,
        previousMeal,
        nextMeal: meal,
      });
    } catch (e) {
      set({
        weeks: {
          ...weeks,
          [weekStartIso]: bundle,
        },
      });
      throw e;
    }
  },
}));
