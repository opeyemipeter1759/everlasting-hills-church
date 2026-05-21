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