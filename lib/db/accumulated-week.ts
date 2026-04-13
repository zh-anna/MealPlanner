import { supabase } from '@/lib/supabase';
import {
  addDays,
  calendarDateKeyLocal,
  getNextWeekStartMonday,
  isoMondayToLocalDate,
} from '@/lib/week';

export async function getNextAccumulatedWeekStartIso(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('week_plans')
    .select('week_start_date')
    .eq('user_id', userId)
    .order('week_start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data?.week_start_date) {
    return calendarDateKeyLocal(getNextWeekStartMonday(new Date()));
  }

  const maxMonday = isoMondayToLocalDate(data.week_start_date as string);
  const nextMonday = addDays(maxMonday, 7);
  return calendarDateKeyLocal(nextMonday);
}
