export const WEEKDAY_LABELS_SHORT_UK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'] as const;

export function weekdayIndexMondayFirst(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

export function calendarDateKeyLocal(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function startOfWeekMonday(date: Date = new Date()): Date {
  const day = date.getDay();
  const diffToMonday = (day + 6) % 7;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

export function getCurrentWeekStartMonday(d = new Date()): Date {
  return startOfWeekMonday(d);
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function getNextWeekStartMonday(d = new Date()): Date {
  return addDays(getCurrentWeekStartMonday(d), 7);
}

export function dateForWeekDayIndex(dayIndex: number, baseDate: Date = new Date()): Date {
  const start = startOfWeekMonday(baseDate);
  const out = new Date(start);
  out.setDate(start.getDate() + dayIndex);
  return out;
}

export function dateForDayInWeek(dayIndex: number, weekStartMonday: Date): Date {
  const out = new Date(weekStartMonday);
  out.setDate(weekStartMonday.getDate() + dayIndex);
  return out;
}

export function isoMondayToLocalDate(weekStartIso: string): Date {
  const [y, m, d] = weekStartIso.split('-').map(Number);
  const x = new Date(y, m - 1, d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function formatWeekdayDateUk(date: Date): string {
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}

export function formatWeekRangeLabelUk(weekStartIso: string): string {
  const start = isoMondayToLocalDate(weekStartIso);
  const end = addDays(start, 6);
  const a = start.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  const b = end.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
  return `${a} — ${b}`;
}
