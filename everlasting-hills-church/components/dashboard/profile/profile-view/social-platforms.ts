import { Instagram, Facebook, Twitter, Linkedin, Music2, type LucideIcon } from "lucide-react";

export interface SocialPlatform {
  key: "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok";
  label: string;
  Icon: LucideIcon;
  brandColor: string;
  buildUrl: (v: string) => string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "instagram",
    label: "Instagram",
    Icon: Instagram,
    brandColor: "#E1306C",
    buildUrl: (v) => (v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`),
  },
  {
    key: "facebook",
    label: "Facebook",
    Icon: Facebook,
    brandColor: "#1877F2",
    buildUrl: (v) => (v.startsWith("http") ? v : `https://facebook.com/${v.replace(/^@/, "")}`),
  },
  {
    key: "twitter",
    label: "Twitter / X",
    Icon: Twitter,
    brandColor: "#1DA1F2",
    buildUrl: (v) => (v.startsWith("http") ? v : `https://twitter.com/${v.replace(/^@/, "")}`),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    Icon: Linkedin,
    brandColor: "#0A66C2",
    buildUrl: (v) => (v.startsWith("http") ? v : `https://linkedin.com/in/${v.replace(/^@/, "")}`),
  },
  {
    key: "tiktok",
    label: "TikTok",
    Icon: Music2,
    brandColor: "#69C9D0",
    buildUrl: (v) => (v.startsWith("http") ? v : `https://tiktok.com/@${v.replace(/^@/, "")}`),
  },
];

/** Renders a clean @handle from either a raw handle or a full profile URL. */
export function extractHandle(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    try {
      const segment = new URL(value).pathname.split("/").filter(Boolean).pop();
      return segment ? `@${segment.replace(/^@/, "")}` : value;
    } catch {
      return value;
    }
  }
  return `@${value.replace(/^@/, "")}`;
}
