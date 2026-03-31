import type { DayPlan } from '@/types/meals';

const KEY_SEP = '\u001f';

export type ShoppingLine = {
  id: string;
  name: string;
  amount: number;
  unit: string;
  note?: string;
};

function aggregateKey(name: string, unit: string): string {
  return `${name.trim().toLowerCase()}${KEY_SEP}${unit.trim()}`;
}

export function dayIndicesFromTodayThroughWeekEnd(todayMondayFirst: number): number[] {
  const start = Math.max(0, Math.min(6, todayMondayFirst));
  return Array.from({ length: 7 - start }, (_, i) => start + i);
}

export function aggregateShoppingLines(menu: DayPlan[], dayIndices: number[]): ShoppingLine[] {
  const totals = new Map<
    string,
    { displayName: string; unit: string; amount: number; note?: string }
  >();

  for (const di of dayIndices) {
    const day = menu[di];
    if (!day) continue;
    for (const meal of [day.breakfast, day.lunch, day.dinner]) {
      for (const ing of meal.ingredients) {
        const k = aggregateKey(ing.name, ing.unit);
        const cur = totals.get(k);
        const n = ing.amount;
        if (cur) {
          cur.amount += n;
          if (ing.note) {
            if (!cur.note) cur.note = ing.note;
            else if (!cur.note.includes(ing.note)) cur.note = `${cur.note}; ${ing.note}`;
          }
        } else {
          totals.set(k, {
            displayName: ing.name.trim(),
            unit: ing.unit.trim(),
            amount: n,
            note: ing.note,
          });
        }
      }
    }
  }

  return Array.from(totals.entries())
    .map(([id, v]) => ({
      id,
      name: v.displayName,
      unit: v.unit,
      amount: v.amount,
      note: v.note,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
}

export function formatAmount(amount: number): string {
  if (Number.isInteger(amount)) return String(amount);
  const t = Math.round(amount * 10) / 10;
  return String(t);
}
