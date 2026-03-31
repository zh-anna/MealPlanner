import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BodyMeasurementEntry } from '@/types/body-stats';

type State = {
  entries: BodyMeasurementEntry[];
};

type Actions = {
  upsertEntry: (patch: BodyMeasurementEntry) => void;
  removeEntryForDate: (date: string) => void;
};

export const useBodyStatsStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      entries: [],
      upsertEntry: (patch) => {
        const date = patch.date;
        if (!date) return;
        const cur = get().entries;
        const idx = cur.findIndex((e) => e.date === date);
        const merged: BodyMeasurementEntry = {
          ...(idx >= 0 ? cur[idx] : {}),
          ...patch,
          date,
        };
        const next =
          idx >= 0 ? cur.map((e, i) => (i === idx ? merged : e)) : [...cur, merged];
        set({ entries: next.sort((a, b) => a.date.localeCompare(b.date)) });
      },
      removeEntryForDate: (date) =>
        set({ entries: get().entries.filter((e) => e.date !== date) }),
    }),
    {
      name: 'mealplanner-body-stats',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
