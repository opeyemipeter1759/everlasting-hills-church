/**
 * Church contact, service, and social details shown in transactional emails.
 *
 * Single source of truth so every email stays consistent. Update here when the
 * church's details change — the templates read from this object.
 */
export const CHURCH_INFO = {
  name: 'Everlasting Hills Church',
  address: 'STARLIGHT HOUSE - 7, Abimbola Ayorinde Street, Odo Niser Junction, Orogun',
  phone: '+234 706 872 7719',
  email: 'everlastinghills.org',

  /** Service schedule (matches the website's /visit page). */
  services: [
    { name: 'Sunday Service', time: 'Sundays · 9:00 AM ' },
    { name: 'Midweek Service', time: 'Wednesdays · 5:30 PM ' },
  ],

  /** The church's WhatsApp community (not the office chat number). */
  whatsappCommunity: 'https://chat.whatsapp.com/HWAW4Cr3ByqIUJKEtRiWUX',
  /** The Telegram channel the website's audio sermons come from. */
  telegramSermons: 'https://t.me/Pastoropeyemipeter',

  /**
   * Social / community links. Only entries with a non-empty `href` are rendered.
   * The first-timer welcome reads the social accounts from the website's own
   * settings instead (see church-links.ts); these are the fallback.
   */
  socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/share/1AwdEL3f52/' },
    { label: 'Instagram', href: 'https://www.instagram.com/everlastinghillschurch?igsh=d2YwOWJlc2FtZnNs' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@everlasting_hills_church' },
    { label: 'WhatsApp Community', href: 'https://chat.whatsapp.com/HWAW4Cr3ByqIUJKEtRiWUX' },
    { label: 'YouTube', href: 'https://youtube.com/@everlastinghillschurch?si=3ftJeVz2a6F7Hu3g' },
    { label: 'Telegram (audio sermons)', href: 'https://t.me/Pastoropeyemipeter' },
  ],
} as const;
