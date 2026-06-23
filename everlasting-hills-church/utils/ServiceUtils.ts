import { SERVICES } from "../config/config";

export function getNextService(now: Date): { label: string; day: "sunday" | "wednesday" } {
  const dow = now.getDay();
  const totalMins = now.getHours() * 60 + now.getMinutes();

  const sunEndMins = SERVICES.sunday.endH * 60 + SERVICES.sunday.endM;
  const wedEndMins = SERVICES.wednesday.endH * 60 + SERVICES.wednesday.endM;

  if (dow === 0 && totalMins < sunEndMins) return { label: "Sunday", day: "sunday" };
  if (dow === 3 && totalMins < wedEndMins) return { label: "Wednesday", day: "wednesday" };

  const daysUntilSun = (7 - dow) % 7 || (dow === 0 && totalMins >= sunEndMins ? 7 : 0);
  const daysUntilWed =
    dow < 3 ? 3 - dow : dow === 3 && totalMins < wedEndMins ? 0 : 7 - dow + 3;

  return daysUntilSun <= daysUntilWed
    ? { label: "Sunday", day: "sunday" }
    : { label: "Wednesday", day: "wednesday" };
}

export function isLiveNow(now: Date): boolean {
  const dow = now.getDay();
  const totalMins = now.getHours() * 60 + now.getMinutes();

  if (dow === 0) {
    const start = SERVICES.sunday.liveStartH * 60 + SERVICES.sunday.liveStartM;
    const end = SERVICES.sunday.endH * 60 + SERVICES.sunday.endM;
    return totalMins >= start && totalMins <= end;
  }
  if (dow === 3) {
    const start = SERVICES.wednesday.liveStartH * 60 + SERVICES.wednesday.liveStartM;
    const end = SERVICES.wednesday.endH * 60 + SERVICES.wednesday.endM;
    return totalMins >= start && totalMins <= end;
  }
  return false;
}

export function isServiceDay(now: Date, serviceDay: "sunday" | "wednesday"): boolean {
  const dow = now.getDay();
  const totalMins = now.getHours() * 60 + now.getMinutes();
  const svc = SERVICES[serviceDay];
  const end = svc.endH * 60 + svc.endM;
  return dow === svc.day && totalMins < end;
}

// ── Member Display Helpers ────────────────────────────────────────────────────

export function fmtDate(iso: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function fmtShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "Last week";
  return `${weeks} weeks ago`;
}

export function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function standingLabel(rate: number): { text: string; color: string } {
  if (rate >= 90) return { text: "Excellent Standing", color: "text-emerald-600 dark:text-emerald-400" };
  if (rate >= 70) return { text: "Good Standing",     color: "text-sky-600 dark:text-sky-400"     };
  if (rate >= 50) return { text: "Fair Standing",     color: "text-amber-600 dark:text-amber-400"  };
  if (rate > 0)   return { text: "Needs Improvement", color: "text-red-600 dark:text-red-400"      };
  return            { text: "No records yet",          color: "text-gray-400"                       };
}

export function streakLabel(weeks: number): { text: string; dot: string } {
  if (weeks >= 8) return { text: "Consistent level", dot: "bg-purple-500" };
  if (weeks >= 4) return { text: "Firm level",        dot: "bg-emerald-500" };
  if (weeks >= 2) return { text: "Building level",    dot: "bg-sky-500"    };
  if (weeks === 1) return { text: "Starting level",   dot: "bg-amber-500"  };
  return             { text: "No streak yet",         dot: "bg-gray-400"   };
}