import type { PersonRow } from "@/lib/api/people";

export function exportRowsCsv(people: PersonRow[]) {
  const headers = ["Name", "Email", "Phone", "Gender", "Role", "Status", "Units", "Tags", "Birthday", "Joined"];
  const body = people.map((p) => [
    p.name,
    p.email ?? "",
    p.phone ?? "",
    p.gender ?? "",
    p.role,
    p.status,
    p.units.map((u) => u.name).join("; "),
    p.tags.join("; "),
    p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
    p.joinedAt.slice(0, 10),
  ]);
  const csv = [headers, ...body]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `people-selected-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
