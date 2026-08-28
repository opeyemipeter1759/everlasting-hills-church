/**
 * Builds a wa.me deep link that opens WhatsApp (app or web) with the message
 * pre-filled — the human still taps send. There's no WhatsApp Business API
 * integration in this app, so this is the "send via WhatsApp" mechanism
 * everywhere the follow-up spec calls for one.
 */
export function buildWhatsAppLink(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, '');
  if (!digits) return null;
  // Best-effort local-to-international normalization for Nigerian numbers
  // (the church's home country) — a leading 0 becomes the +234 country code;
  // anything already in international form is left as-is.
  const normalized = digits.startsWith('+')
    ? digits.slice(1)
    : digits.startsWith('0')
      ? `234${digits.slice(1)}`
      : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}
