/**
 * A Nigerian mobile number, as typed at the roadside: "0803 123 4567",
 * "+234 803 123 4567", "2348031234567", "803-123-4567". Returns it as
 * +234XXXXXXXXXX, or null when it isn't one.
 */
export function normaliseNigerianPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, '').replace(/^\+/, '');
  let local: string;
  if (/^234\d{10}$/.test(digits)) local = digits.slice(3);
  else if (/^0\d{10}$/.test(digits)) local = digits.slice(1);
  else if (/^\d{10}$/.test(digits)) local = digits;
  else return null;
  // Mobile numbers start 70x, 80x, 81x, 90x, 91x.
  if (!/^[789][01]\d{8}$/.test(local)) return null;
  return `+234${local}`;
}
