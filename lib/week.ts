/** Короткі підписи Пн…Нд — узгоджено з `DayPlan.day` і persist меню. */
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

export function dateForWeekDayIndex(dayIndex: number, baseDate: Date = new Date()): Date {
  const start = startOfWeekMonday(baseDate);
  const d = new Date(start);
  d.setDate(start.getDate() + dayIndex);
  return d;
}

export function formatWeekdayDateUk(date: Date): string {
  return date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
}
