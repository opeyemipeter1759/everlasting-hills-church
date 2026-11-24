import {
  BookOpen,
  CirclePlay,
  Flame,
  Gift,
  GraduationCap,
  HandCoins,
  HandHeart,
  HandHelping,
  HeartHandshake,
  Home,
  Info,
  MapPin,
  Megaphone,
  MessageCircle,
  Quote,
  Sparkles,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavChild = {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
};

export type NavLink = {
  /** Unique key; also used to track which dropdown is open. */
  id: string;
  label: string;
  /** Plain links only. Dropdown parents navigate through their children. */
  href?: string;
  /** Present only for items that render as a dropdown (desktop) / accordion (mobile). */
  children?: NavChild[];
  /** Optional call-to-action strip along the bottom of the desktop dropdown. */
  footer?: { text: string; label: string; href: string };
};

export const navLinks: NavLink[] = [
  {
    id: "about",
    label: "About",
    children: [
      { label: "About Us", href: "/about", description: "Our story, vision and beliefs", icon: Info },
      { label: "Our Culture", href: "/cultures", description: "The values that shape us", icon: Sparkles },
      { label: "Our Pastors", href: "/Pastor", description: "Meet the people who lead us", icon: Users },
      { label: "Plan a Visit", href: "/visit", description: "What to expect on a Sunday", icon: MapPin },
      { label: "Find Us", href: "/contact", description: "Directions and contact details", icon: MessageCircle },
    ],
  },
  {
    id: "media",
    label: "Media",
    children: [
      { label: "Sermons", href: "/sermons", description: "Watch and listen to past messages", icon: CirclePlay },
      { label: "Articles", href: "/articles", description: "Devotionals and teaching to read", icon: BookOpen },
    ],
  },
  {
    id: "ministries",
    label: "Ministries",
    children: [
      { label: "All Ministries", href: "/ministries", description: "Find where you belong", icon: Users },
      { label: "Home Cell", href: "/home-cell", description: "Midweek fellowship near you", icon: Home },
      { label: "Prayer Watch", href: "/prayer-watch", description: "Join the church in prayer", icon: Flame },
      { label: "Serve in a Unit", href: "/connect/serve", description: "Use your gifts in the house", icon: HandHelping },
      { label: "Evangelism", href: "/evangelism/form", description: "Reach out and report souls", icon: Megaphone },
      { label: "Welfare", href: "/welfare", description: "Ask for support when in need", icon: HandHeart },
    ],
    footer: { text: "Not sure where you fit?", label: "Join a home cell", href: "/home-cell" },
  },
  {
    id: "next-steps",
    label: "Next Steps",
    children: [
      { label: "I'm New Here", href: "/first-timer", description: "Tell us a little about you", icon: UserPlus },
      { label: "I Gave My Life to Christ", href: "/salvation", description: "Start your walk with Jesus", icon: Sparkles },
      { label: "Membership Class", href: "/classes/membership", description: "Become part of the family", icon: GraduationCap },
      { label: "Prayer Request", href: "/prayer-request", description: "Let us pray with you", icon: Flame },
      { label: "Talk to a Pastor", href: "/talk-to-a-pastor", description: "Book time with a pastor", icon: MessageCircle },
      { label: "Pre-Marital Counselling", href: "/pre-marital-counselling", description: "Prepare for marriage together", icon: HeartHandshake },
      { label: "Share a Testimony", href: "/testimony", description: "Tell what God has done", icon: Quote },
    ],
    footer: { text: "First time with us?", label: "Plan your visit", href: "/visit" },
  },
  { id: "events", label: "Events", href: "/events" },
];

/** Rendered as a button on desktop (right side) and as a normal accordion in the mobile menu. */
export const giveLink: NavLink = {
  id: "give",
  label: "Give",
  children: [
    { label: "Give Online", href: "/give", description: "Tithes, offerings and seeds", icon: Gift },
    { label: "Make a Pledge", href: "/pledge", description: "Commit to a project or fund", icon: HandCoins },
  ],
};

/** Signed-in members get this in the mobile menu; on desktop it lives in the avatar menu. */
export const ATTENDANCE_HREF = "/#attendance";

/** Public pages that open on a light background, so the bar starts with dark text. */
export const LIGHT_PAGES = ["/articles", "/Pastor", "/pledge"];

/** Mega-menu (two columns) for dropdowns with more items than this. */
export const MEGA_THRESHOLD = 4;

export function isPathActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  const path = href.split("#")[0] || "/";
  if (path === "/") return pathname === "/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function isLinkActive(pathname: string | null, link: NavLink) {
  if (link.children) return link.children.some((c) => isPathActive(pathname, c.href));
  return !!link.href && isPathActive(pathname, link.href);
}
