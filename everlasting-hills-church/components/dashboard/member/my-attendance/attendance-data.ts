export interface HistoryRow {
  id: string;
  serviceName: string;
  date: string;
  status: "present" | "absent";
  mode: "onsite" | null;
}

export interface HistoryResponse {
  member: { name: string; email: string | null; phone: string | null } | null;
  records: HistoryRow[];
}

export type ColKey = "id" | "name" | "email" | "phone" | "service" | "date" | "status" | "mode";

/** One table row, already formatted for display, filtering and the CSV. */
export type AttendanceRow = { raw: HistoryRow } & Record<ColKey, string>;

export const COLS: { key: ColKey; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "service", label: "Service" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "mode", label: "Mode" },
];

export const EMPTY_FILTERS: Record<ColKey, string> = {
  id: "", name: "", email: "", phone: "", service: "", date: "", status: "", mode: "",
};

/** Stable 4-digit display id from a uuid, so the ID column reads cleanly. */
export function shortId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (id.charCodeAt(i) + ((h << 5) - h)) | 0;
  return String((Math.abs(h) % 9000) + 1000);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function toRows(data: HistoryResponse | undefined): AttendanceRow[] {
  const member = data?.member ?? null;
  return (data?.records ?? []).map((r) => ({
    raw: r,
    id: shortId(r.id),
    name: member?.name ?? "—",
    email: member?.email ?? "—",
    phone: member?.phone ?? "—",
    service: r.serviceName,
    date: fmtDate(r.date),
    status: r.status,
    mode: r.mode ?? "--",
  }));
}

/** Rows matching every non-empty column filter (case-insensitive "contains"). */
export function filterRows(rows: AttendanceRow[], filters: Record<ColKey, string>): AttendanceRow[] {
  return rows.filter((row) =>
    COLS.every(({ key }) => {
      const q = filters[key].trim().toLowerCase();
      return !q || row[key].toLowerCase().includes(q);
    }),
  );
}

export function attendanceStats(rows: AttendanceRow[]) {
  const total = rows.length;
  const present = rows.filter((r) => r.status === "present").length;
  return { total, present, absent: total - present, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
}

/** Downloads the given rows as my-attendance.csv, built in the browser. */
export function exportCsv(rows: AttendanceRow[]) {
  const body = rows.map((r) => COLS.map(({ key }) => r[key]));
  const csv = [COLS.map((c) => c.label), ...body]
    .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "my-attendance.csv";
  a.click();
  URL.revokeObjectURL(url);
}
