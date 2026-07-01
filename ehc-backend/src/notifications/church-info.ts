/**
 * Church contact, service, and social details shown in transactional emails.
 *
 * Single source of truth so every email stays consistent. Update here when the
 * church's details change — the templates read from this object.
 */
export const CHURCH_INFO = {
  name: 'Everlasting Hills Church',
  address: 'Ibadan, Oyo State, Nigeria',
  phone: '+234 706 872 7719',
  email: 'hello@everlastinghills.org',

  /** Service schedule (matches the website's /visit page). */
  services: [
    { name: 'Sunday Service', time: 'Sundays · 9:00 AM – 12:00 PM' },
    { name: 'Midweek Service', time: 'Wednesdays · 5:30 PM – 8:00 PM' },
  ],

  /**
   * Social / community links. Only entries with a non-empty `href` are rendered.
   * TODO: add the Telegram channel URL (audio sermons) when available.
   */
  socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/share/1AwdEL3f52/' },
    { label: 'Instagram', href: 'https://www.instagram.com/everlastinghillschurch?igsh=d2YwOWJlc2FtZnNs' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@everlasting_hills_church' },
    { label: 'WhatsApp Community', href: 'https://wa.me/2347068727719' },
    { label: 'YouTube', href: 'https://youtube.com/@everlastinghillschurch?si=3ftJeVz2a6F7Hu3g' },
    { label: 'Telegram', href: '' },
  ],
} as const;
