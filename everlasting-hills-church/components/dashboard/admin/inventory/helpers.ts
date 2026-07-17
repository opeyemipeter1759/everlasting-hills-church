export function formatNaira(value: number | null | undefined): string {
  if (value == null) return "—";
  return `₦${value.toLocaleString()}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
