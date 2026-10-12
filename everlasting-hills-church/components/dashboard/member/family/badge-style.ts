import {
  BookOpen,
  Cake,
  Church,
  Cross,
  Flag,
  GraduationCap,
  Heart,
  Library,
  Megaphone,
  MessageCircle,
  PenLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { BadgeLevel, BadgeTrack } from "@/lib/api/family";

export const TRACK_ICON: Record<BadgeTrack, LucideIcon> = {
  attendance: Church,
  bibleDays: BookOpen,
  plansFinished: Flag,
  reached: Megaphone,
  saved: Sparkles,
  salvation: Cross,
  books: Library,
  birthdays: Cake,
  likes: Heart,
  comments: MessageCircle,
  articles: PenLine,
  courses: GraduationCap,
};

/** What each track is about, for the "next badge" list. */
export const TRACK_LABEL: Record<BadgeTrack, string> = {
  attendance: "Service attendance",
  bibleDays: "Days in the Word",
  plansFinished: "Bible plans finished",
  reached: "Evangelism",
  saved: "Souls won",
  salvation: "Salvation",
  books: "Books read",
  birthdays: "Birthday wishes",
  likes: "Liking profiles",
  comments: "Comments",
  articles: "Articles",
  courses: "Courses",
};

/** Medal colours, rising in value from bronze to diamond. */
export const LEVEL_STYLE: Record<BadgeLevel, { ring: string; fill: string; label: string }> = {
  bronze: { ring: "#B0724A", fill: "linear-gradient(145deg,#E8B48F,#B0724A)", label: "Bronze" },
  silver: { ring: "#8C96A3", fill: "linear-gradient(145deg,#E4E8EE,#8C96A3)", label: "Silver" },
  gold: { ring: "#C9A227", fill: "linear-gradient(145deg,#F6DE86,#C9A227)", label: "Gold" },
  platinum: { ring: "#4F8EA3", fill: "linear-gradient(145deg,#BFE3EE,#4F8EA3)", label: "Platinum" },
  diamond: { ring: "#7B5CD6", fill: "linear-gradient(145deg,#D9CCFF,#7B5CD6)", label: "Diamond" },
};
