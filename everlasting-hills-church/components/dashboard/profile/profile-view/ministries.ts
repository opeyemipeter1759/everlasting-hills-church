import { Crown, Flower2, Zap, Heart, type LucideIcon } from "lucide-react";
import { computeAgeGroup } from "./helpers";

export interface MinistryInfo {
  slug: string;
  name: string;
  schedule: string;
  icon: LucideIcon;
}

export const MINISTRY_INFO: Record<"mens" | "womens" | "teens" | "couples", MinistryInfo> = {
  mens: { slug: "mens", name: "Men's Ministry", schedule: "Every 2nd Saturday · 7:00 AM", icon: Crown },
  womens: { slug: "womens", name: "Women's Ministry", schedule: "Every 1st Sunday · After Service", icon: Flower2 },
  teens: { slug: "teens", name: "Teen's Ministry", schedule: "Every Friday · 5:00 PM", icon: Zap },
  couples: { slug: "couples", name: "Couple's Ministry", schedule: "Every 3rd Saturday · 4:00 PM", icon: Heart },
};

export function getMyMinistries(
  dateOfBirth: string | null,
  gender: string | null,
  married: boolean,
): MinistryInfo[] {
  const ageGroup = computeAgeGroup(dateOfBirth);
  if (ageGroup === "teen") return [MINISTRY_INFO.teens];
  if (ageGroup !== "adult" || !gender) return [];

  const ministries: MinistryInfo[] = [];
  if (gender === "Male") ministries.push(MINISTRY_INFO.mens);
  if (gender === "Female") ministries.push(MINISTRY_INFO.womens);
  if (married) ministries.push(MINISTRY_INFO.couples);
  return ministries;
}
