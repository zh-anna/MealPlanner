import { supabase } from '@/lib/supabase';
import type { BodyMeasurementEntry } from '@/types/body-stats';

function rowToEntry(row: {
  date: string;
  weight_kg: string | number | null;
  chest_cm: string | number | null;
  underbust_cm: string | number | null;
  waist_cm: string | number | null;
  hips_cm: string | number | null;
}): BodyMeasurementEntry {
  const n = (v: string | number | null | undefined) =>
    v == null || v === '' ? undefined : Number(v);

  return {
    date: row.date,
    ...(n(row.weight_kg) != null ? { weightKg: n(row.weight_kg)! } : {}),
    ...(n(row.chest_cm) != null ? { chestCm: n(row.chest_cm)! } : {}),
    ...(n(row.underbust_cm) != null ? { underbustCm: n(row.underbust_cm)! } : {}),
    ...(n(row.waist_cm) != null ? { waistCm: n(row.waist_cm)! } : {}),
    ...(n(row.hips_cm) != null ? { hipsCm: n(row.hips_cm)! } : {}),
  };
}

export async function fetchBodyEntries(userId: string): Promise<BodyMeasurementEntry[]> {
  const { data, error } = await supabase
    .from('body_measurement_entries')
    .select('date, weight_kg, chest_cm, underbust_cm, waist_cm, hips_cm')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => rowToEntry(r as Parameters<typeof rowToEntry>[0]));
}

export async function upsertBodyEntryRemote(
  userId: string,
  patch: BodyMeasurementEntry,
): Promise<void> {
  const date = patch.date;
  if (!date) return;

  const row = {
    user_id: userId,
    date,
    weight_kg: patch.weightKg ?? null,
    chest_cm: patch.chestCm ?? null,
    underbust_cm: patch.underbustCm ?? null,
    waist_cm: patch.waistCm ?? null,
    hips_cm: patch.hipsCm ?? null,
  };

  const { error } = await supabase.from('body_measurement_entries').upsert(row, {
    onConflict: 'user_id,date',
  });

  if (error) throw error;
}

export async function deleteBodyEntryRemote(userId: string, date: string): Promise<void> {
  const { error } = await supabase
    .from('body_measurement_entries')
    .delete()
    .eq('user_id', userId)
    .eq('date', date);

  if (error) throw error;
}
