/** "Sat 14 Nov, 7:45 am" in Lagos time, whatever the viewer's own timezone. */
export function lagosWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Lagos" });
  const time = d
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" })
    .replace(":00", "")
    .toLowerCase();
  return `${day}, ${time}`;
}

/** "7:45 am" in Lagos time. */
export function lagosTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso)
    .toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" })
    .toLowerCase();
}
