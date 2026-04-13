import { supabase } from '@/lib/supabase';

export type ShoppingChecksMap = Record<string, Record<string, boolean>>;

export async function fetchShoppingChecks(weekPlanId: string): Promise<ShoppingChecksMap> {
  const { data, error } = await supabase
    .from('shopping_line_states')
    .select('scope_key, line_key, is_checked')
    .eq('week_plan_id', weekPlanId);

  if (error) throw error;

  const map: ShoppingChecksMap = {};
  for (const r of data ?? []) {
    if (!map[r.scope_key]) map[r.scope_key] = {};
    map[r.scope_key][r.line_key] = r.is_checked;
  }
  return map;
}

export async function upsertShoppingCheckRemote(params: {
  weekPlanId: string;
  scopeKey: string;
  lineKey: string;
  isChecked: boolean;
}): Promise<void> {
  const { error } = await supabase.from('shopping_line_states').upsert(
    {
      week_plan_id: params.weekPlanId,
      scope_key: params.scopeKey,
      line_key: params.lineKey,
      is_checked: params.isChecked,
    },
    { onConflict: 'week_plan_id,scope_key,line_key' },
  );

  if (error) throw error;
}
