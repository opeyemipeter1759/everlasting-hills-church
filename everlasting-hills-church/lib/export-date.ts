/**
 * Every file exported from the site carries the day it was exported, so two
 * exports never collide and anyone opening one later knows how current it is.
 * The day is the church's (Africa/Lagos, UTC+1 all year), not the UTC day,
 * which would still say yesterday for the first hour after midnight.
 */
export function exportDate(now = new Date()): string {
  return new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** "people-export" + "xlsx" → "people-export-2026-11-27.xlsx". A name that already ends in an extension keeps it. */
export function datedFilename(name: string, ext?: string, now = new Date()): string {
  const match = ext ? null : name.match(/^(.*)\.([a-z0-9]+)$/i);
  const base = (match ? match[1] : name).replace(/-+$/, "") || "export";
  return `${base}-${exportDate(now)}.${ext ?? match?.[2] ?? "csv"}`;
}
