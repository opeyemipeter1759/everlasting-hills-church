/**
 * Single source of truth for the "Heaven on Earth" event.
 *
 * Edit values here — every section on the event page reads from this file. Avoids
 * scattering hard-coded dates/venues across components.
 *
 * EVENT_DATE is parsed by CountdownTimer; if you want a different timezone, append
 * the offset (e.g. "...T18:00:00+01:00" for WAT).
 */

export const HEAVEN_ON_EARTH = {
  title: "Heaven on Earth",
  tagline:
    "Experience God's presence, powerful worship, transformational teaching, and a gathering designed to awaken hearts and strengthen faith.",
  closingTagline:
    "Join us for a gathering where faith is strengthened, lives are transformed, and hearts are awakened to God's presence.",

  // Date in ISO 8601 with WAT offset (UTC+1)
  date: "2026-08-15T17:00:00+01:00",
  dateDisplay: "Friday, 15 August 2026",
  timeDisplay: "5:00 PM — 9:00 PM (WAT)",

  venue: {
    name: "Hills Auditorium",
    address: "Everlasting Hills Church, Ibadan, Oyo State",
  },

  hostPastor: "Pastor Bowale Okunola",
  guestMinister: "TBA — to be announced",

  contact: {
    phone: "+234 706 872 7719",
    email: "events@everlastinghills.org",
    whatsapp: "https://wa.me/2347068727719",
  },

  // Drop your flyer at /public/events/heaven-on-earth.jpg and the FlyerShowcase
  // will pick it up automatically.
  flyerImagePath: "/events/heaven-on-earth.jpg",

  scripture: {
    text: "Your kingdom come. Your will be done on earth as it is in heaven.",
    reference: "Matthew 6:10",
  },

  pastor: {
    name: "Pastor Bowale Okunola",
    title: "Senior Pastor, Everlasting Hills Church",
  },

  specialNotes: [
    "Doors open 30 minutes before service.",
    "Childcare available throughout.",
    "Live worship band + special guest minister.",
  ],

  // Used by both the hero CTA target and the RSVP form anchor
  rsvpAnchor: "#rsvp",
};

export type HeavenOnEarth = typeof HEAVEN_ON_EARTH;
