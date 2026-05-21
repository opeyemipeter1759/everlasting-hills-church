// ── CHURCH CONFIG — update these ──
export const CHURCH = {
  name: "Everlasting Hills Church",
  address: "Ibadan, Oyo State, Nigeria",
  lat: 7.3775,
  lng: 3.9470,
  youtubeUrl: "https://www.youtube.com/@yourchannel/live", // ← replace
};

// ── SERVICE SCHEDULE ──
// Sunday:    9:00 AM – 12:00 PM  (live window: 8:45 AM – 12:00 PM)
// Wednesday: 5:30 PM –  8:00 PM  (live window: 5:15 PM –  8:00 PM)
export const SERVICES = {
  sunday: {
    day: 0,
    startH: 9,  startM: 0,
    endH: 12,   endM: 0,
    liveStartH: 8, liveStartM: 45,
  },
  wednesday: {
    day: 3,
    startH: 17, startM: 30,
    endH: 20,   endM: 0,
    liveStartH: 17, liveStartM: 15,
  },
};

// ── Types ──
export type TravelMode = "driving" | "walking" | "transit";

export interface RouteInfo {
  distance: string;
  duration: string;
  mode: TravelMode;
}