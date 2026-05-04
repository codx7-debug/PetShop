/**
 * Calendar date (YYYY-MM-DD) for an instant in a given IANA time zone.
 */
export function localDateString(isoOrDate, timeZone) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Hours from now until startsAt (floating, can be fractional).
 */
export function hoursUntil(startsAtIso) {
  const start = new Date(startsAtIso).getTime();
  const now = Date.now();
  return (start - now) / (1000 * 60 * 60);
}
