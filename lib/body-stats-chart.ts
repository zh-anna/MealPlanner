import type { BodyMeasurementEntry } from '@/types/body-stats';

export type ChartPoint = {
  value: number;
  label: string;
  date: string;
};

export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatChartLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

export function formatChartTooltipDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatChartAxisDayMonth(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const dt = new Date(y, m - 1, d);
  const dayLine = dt.toLocaleDateString('uk-UA', { day: 'numeric' });
  const monthLine = dt.toLocaleDateString('uk-UA', { month: 'short' });
  return `${dayLine}\n${monthLine}`;
}

function sortByDate(entries: BodyMeasurementEntry[]): BodyMeasurementEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function hasAnyVolume(e: BodyMeasurementEntry): boolean {
  return [e.chestCm, e.underbustCm, e.waistCm, e.hipsCm].some((v) => v != null && Number.isFinite(v));
}

type VolKey = 'chestCm' | 'underbustCm' | 'waistCm' | 'hipsCm';

function alignSeries(
  dates: string[],
  key: VolKey,
  byDate: Map<string, BodyMeasurementEntry>,
): { values: number[]; has: boolean } {
  const raw = dates.map((d) => {
    const v = byDate.get(d)?.[key];
    return v != null && Number.isFinite(v) ? v : undefined;
  });
  const has = raw.some((v) => v != null);
  if (!has) return { values: dates.map(() => 0), has: false };

  let last: number | undefined;
  const fwd: (number | undefined)[] = raw.map((v) => {
    if (v != null) last = v;
    return last;
  });

  let next: number | undefined;
  for (let i = raw.length - 1; i >= 0; i--) {
    if (raw[i] != null) next = raw[i];
    else if (next != null && fwd[i] == null) fwd[i] = next;
  }

  return { values: fwd.map((x) => x ?? 0), has: true };
}

export function buildVolumeSeriesMulti(entries: BodyMeasurementEntry[]): {
  labels: string[];
  dates: string[];
  chest: number[];
  underbust: number[];
  waist: number[];
  hips: number[];
  flags: { chest: boolean; underbust: boolean; waist: boolean; hips: boolean };
} | null {
  const sorted = sortByDate(entries);
  const byDate = new Map<string, BodyMeasurementEntry>();
  for (const e of sorted) {
    const prev = byDate.get(e.date);
    byDate.set(e.date, { ...prev, ...e, date: e.date });
  }

  const dates = [...byDate.keys()]
    .filter((d) => hasAnyVolume(byDate.get(d)!))
    .sort((a, b) => a.localeCompare(b));

  if (dates.length === 0) return null;

  const labels = dates.map(formatChartAxisDayMonth);
  const c = alignSeries(dates, 'chestCm', byDate);
  const u = alignSeries(dates, 'underbustCm', byDate);
  const w = alignSeries(dates, 'waistCm', byDate);
  const h = alignSeries(dates, 'hipsCm', byDate);

  return {
    labels,
    dates,
    chest: c.values,
    underbust: u.values,
    waist: w.values,
    hips: h.values,
    flags: { chest: c.has, underbust: u.has, waist: w.has, hips: h.has },
  };
}

export function buildWeightSeries(entries: BodyMeasurementEntry[]): ChartPoint[] {
  return sortByDate(entries)
    .filter((e) => e.weightKg != null && Number.isFinite(e.weightKg))
    .map((e) => ({
      value: e.weightKg!,
      label: formatChartAxisDayMonth(e.date),
      date: e.date,
    }));
}

export function parseDecimalInput(raw: string): number | undefined {
  const t = raw.replace(',', '.').trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}
