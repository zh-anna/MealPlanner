import { create } from 'zustand';

import { deleteBodyEntryRemote, fetchBodyEntries, upsertBodyEntryRemote } from '@/lib/db/body-sync';
import { ensureSharedUserSession } from '@/lib/auth/shared-sign-in';
import type { BodyMeasurementEntry } from '@/types/body-stats';

type State = {
  entries: BodyMeasurementEntry[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
};

type Actions = {
  load: () => Promise<void>;
  upsertEntry: (patch: BodyMeasurementEntry) => Promise<void>;
  removeEntryForDate: (date: string) => Promise<void>;
};

export const useBodyStatsStore = create<State & Actions>((set, get) => ({
  entries: [],
  status: 'idle',
  error: null,

  load: async () => {
    set({ status: 'loading', error: null });
    try {
      const { userId } = await ensureSharedUserSession();
      const entries = await fetchBodyEntries(userId);
      set({ entries, status: 'ready', error: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ status: 'error', error: msg });
    }
  },

  upsertEntry: async (patch) => {
    const date = patch.date;
    if (!date) return;
    const { userId } = await ensureSharedUserSession();
    const cur = get().entries;
    const idx = cur.findIndex((e) => e.date === date);
    const merged: BodyMeasurementEntry = {
      ...(idx >= 0 ? cur[idx] : {}),
      ...patch,
      date,
    };
    const next =
      idx >= 0 ? cur.map((e, i) => (i === idx ? merged : e)) : [...cur, merged];
    set({
      entries: next.sort((a, b) => a.date.localeCompare(b.date)),
    });
    await upsertBodyEntryRemote(userId, merged);
  },

  removeEntryForDate: async (date) => {
    const { userId } = await ensureSharedUserSession();
    set({ entries: get().entries.filter((e) => e.date !== date) });
    await deleteBodyEntryRemote(userId, date);
  },
}));
