/**
 * A Nigerian mobile number as 234XXXXXXXXXX, the form wa.me links need, from
 * any of the usual ways people type it: 0803..., +234 803..., 234803..., or
 * 803... without the leading zero. Anything that is not a Nigerian mobile
 * number comes back trimmed and otherwise untouched, so nothing is lost.
 */
export function normalizeNigerianPhone(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  let national: string | null = null;
  if (digits.length === 13 && digits.startsWith('234')) national = digits.slice(3);
  else if (digits.length === 11 && digits.startsWith('0')) national = digits.slice(1);
  else if (digits.length === 10 && /^[789]/.test(digits)) national = digits;
  if (!national || !/^[789][01]\d{8}$/.test(national)) return trimmed;
  return `234${national}`;
}
