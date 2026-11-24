import {
  AboutIcon,
  ArticlesIcon,
  CultureIcon,
  EvangelismIcon,
  FindUsIcon,
  GiveIcon,
  HomeCellIcon,
  MembershipIcon,
  MinistriesIcon,
  NewHereIcon,
  PastorsIcon,
  PlanVisitIcon,
  PledgeIcon,
  PrayerRequestIcon,
  PrayerWatchIcon,
  PreMaritalIcon,
  SalvationIcon,
  SermonsIcon,
  ServeIcon,
  TalkToPastorIcon,
  TestimonyIcon,
  WelfareIcon,
  type IconComponent,
} from "@/components/icons";

export type NavChild = {
  label: string;
  href: string;
  description?: string;
  icon?: IconComponent;
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
      { label: "About Us", href: "/about", description: "Our story, vision and beliefs", icon: AboutIcon },
      { label: "Our Culture", href: "/cultures", description: "The values that shape us", icon: CultureIcon },
      { label: "Our Pastors", href: "/Pastor", description: "Meet the people who lead us", icon: PastorsIcon },
      { label: "Plan a Visit", href: "/visit", description: "What to expect on a Sunday", icon: PlanVisitIcon },
      { label: "Find Us", href: "/contact", description: "Directions and contact details", icon: FindUsIcon },
    ],
  },
  {
    id: "media",
    label: "Media",
    children: [
      { label: "Sermons", href: "/sermons", description: "Watch and listen to past messages", icon: SermonsIcon },
      { label: "Articles", href: "/articles", description: "Devotionals and teaching to read", icon: ArticlesIcon },
    ],
  },
  {
    id: "ministries",
    label: "Ministries",
    children: [
      { label: "All Ministries", href: "/ministries", description: "Find where you belong", icon: MinistriesIcon },
      { label: "Home Cell", href: "/home-cell", description: "Midweek fellowship near you", icon: HomeCellIcon },
      { label: "Prayer Watch", href: "/prayer-watch", description: "Join the church in prayer", icon: PrayerWatchIcon },
      { label: "Serve in a Unit", href: "/connect/serve", description: "Use your gifts in the house", icon: ServeIcon },
      { label: "Evangelism", href: "/evangelism/form", description: "Reach out and report souls", icon: EvangelismIcon },
      { label: "Welfare", href: "/welfare", description: "Ask for support when in need", icon: WelfareIcon },
    ],
    footer: { text: "Not sure where you fit?", label: "Join a home cell", href: "/home-cell" },
  },
  {
    id: "next-steps",
    label: "Next Steps",
    children: [
      { label: "I'm New Here", href: "/first-timer", description: "Tell us a little about you", icon: NewHereIcon },
      { label: "I Gave My Life to Christ", href: "/salvation", description: "Start your walk with Jesus", icon: SalvationIcon },
      { label: "Membership Class", href: "/classes/membership", description: "Become part of the family", icon: MembershipIcon },
      { label: "Prayer Request", href: "/prayer-request", description: "Let us pray with you", icon: PrayerRequestIcon },
      { label: "Talk to a Pastor", href: "/talk-to-a-pastor", description: "Book time with a pastor", icon: TalkToPastorIcon },
      { label: "Pre-Marital Counselling", href: "/pre-marital-counselling", description: "Prepare for marriage together", icon: PreMaritalIcon },
      { label: "Share a Testimony", href: "/testimony", description: "Tell what God has done", icon: TestimonyIcon },
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
    { label: "Give Online", href: "/give", description: "Tithes, offerings and seeds", icon: GiveIcon },
    { label: "Make a Pledge", href: "/pledge", description: "Commit to a project or fund", icon: PledgeIcon },
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
