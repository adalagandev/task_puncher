// Local-time week helpers. A "week" runs Monday 00:00 up to the next Monday 00:00
// in the browser's own timezone, so "this week" matches the user's calendar.

/** Local midnight on the Monday of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // strip time, local
  const mondayOffset = (date.getDay() + 6) % 7; // Sun=6 … Mon=0
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

/**
 * True if the UTC timestamp `iso` falls in the current or previous Mon–Sun week,
 * evaluated in local time. Drives the "wins" section: completions from this week
 * or last week stay visible, older ones drop off.
 */
export function isInCurrentOrPreviousWeek(iso: string, now: Date = new Date()): boolean {
  const when = new Date(iso);
  const thisWeekStart = startOfWeek(now);
  const prevWeekStart = new Date(thisWeekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  return when >= prevWeekStart && when < nextWeekStart;
}
