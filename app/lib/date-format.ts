/**
 * Formats a date as a Spanish session label, e.g. "Jueves 25 de octubre, 2026".
 * Accepts a Date or an ISO string.
 */
export function formatSessionDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const weekday = get("weekday");
  const capitalizedWeekday =
    weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `${capitalizedWeekday} ${get("day")} de ${get("month")}, ${get("year")}`;
}

/**
 * Short timestamp for a chat message: the time alone for today's messages, and
 * a day + time for anything older, so a thread read days later still reads in
 * order without repeating the full date on every bubble.
 */
export function formatMessageTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    ...(isToday ? {} : { day: "numeric", month: "short" }),
  }).format(d);
}
