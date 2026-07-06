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
