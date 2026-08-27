// The API serializes DateTime values as UTC but without a trailing "Z" or offset
// (e.g. "2026-08-26T03:30:00"). Passed straight to `new Date(...)`, the browser
// treats a timestamp with no timezone marker as already being local wall-clock
// time and never converts it — a 09:00 IST job start silently displays as
// "03:30". Only append "Z" when the string actually has a time component and no
// timezone marker of its own; a bare date ("2026-08-26") is already correctly
// UTC-midnight per the ISO 8601 spec and must be left alone.
export function parseServerDate(iso: string): Date {
  const hasTime = /T\d{2}:\d{2}/.test(iso)
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(iso)
  return new Date(hasTime && !hasTz ? `${iso}Z` : iso)
}
