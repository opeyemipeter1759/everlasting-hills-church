/**
 * Every icon the public site uses, and the only file that names the icon
 * library. Swapping libraries means changing these lines and nothing else.
 *
 * - One named re-export per icon, each from its own module, so a page only
 *   ships the icons it imports (no registry that pulls every icon in).
 * - The "ssr" modules work in server and client components alike, so no file
 *   needs "use client" just to show an icon.
 * - Icons that carry meaning get a name for what they mean (PrayerRequestIcon);
 *   interface glyphs keep the library's name (CaretDown).
 * - Never add a glyph that suggests AI or magic: sparkles, wands, robots,
 *   lightning, star bursts. The lint rule refuses them.
 */
export { Icon, type IconComponent, type IconWeight } from "./Icon";

// Next Steps
export { HandWaving as NewHereIcon } from "@phosphor-icons/react/dist/ssr/HandWaving";
export { SunHorizon as SalvationIcon } from "@phosphor-icons/react/dist/ssr/SunHorizon";
export { UsersThree as MembershipIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
export { HandsPraying as PrayerRequestIcon } from "@phosphor-icons/react/dist/ssr/HandsPraying";
export { ChatsCircle as TalkToPastorIcon } from "@phosphor-icons/react/dist/ssr/ChatsCircle";
export { Rings as PreMaritalIcon } from "./custom/Rings";
export { Microphone as TestimonyIcon } from "@phosphor-icons/react/dist/ssr/Microphone";

// About
export { Church as AboutIcon } from "@phosphor-icons/react/dist/ssr/Church";
export { Compass as CultureIcon } from "@phosphor-icons/react/dist/ssr/Compass";
export { Users as PastorsIcon } from "@phosphor-icons/react/dist/ssr/Users";
export { CalendarCheck as PlanVisitIcon } from "@phosphor-icons/react/dist/ssr/CalendarCheck";
export { MapTrifold as FindUsIcon } from "@phosphor-icons/react/dist/ssr/MapTrifold";

// Media
export { PlayCircle as SermonsIcon } from "@phosphor-icons/react/dist/ssr/PlayCircle";
export { BookOpenText as ArticlesIcon } from "@phosphor-icons/react/dist/ssr/BookOpenText";

// Ministries
export { Signpost as MinistriesIcon } from "@phosphor-icons/react/dist/ssr/Signpost";
export { HouseLine as HomeCellIcon } from "@phosphor-icons/react/dist/ssr/HouseLine";
/** The night watch, 10pm to 6am. */
export { Moon as PrayerWatchIcon } from "@phosphor-icons/react/dist/ssr/Moon";
export { Handshake as ServeIcon } from "@phosphor-icons/react/dist/ssr/Handshake";
export { Megaphone as EvangelismIcon } from "@phosphor-icons/react/dist/ssr/Megaphone";
export { HandHeart as WelfareIcon } from "@phosphor-icons/react/dist/ssr/HandHeart";

// Give
export { HandCoins as GiveIcon } from "@phosphor-icons/react/dist/ssr/HandCoins";
export { Signature as PledgeIcon } from "@phosphor-icons/react/dist/ssr/Signature";

// Account
export { SquaresFour as DashboardIcon } from "@phosphor-icons/react/dist/ssr/SquaresFour";
export { UserCircle as ProfileIcon } from "@phosphor-icons/react/dist/ssr/UserCircle";
export { SignOut as SignOutIcon } from "@phosphor-icons/react/dist/ssr/SignOut";
export { CalendarCheck as AttendanceIcon } from "@phosphor-icons/react/dist/ssr/CalendarCheck";

// Interface
export { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
export { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
export { List } from "@phosphor-icons/react/dist/ssr/List";
export { X } from "@phosphor-icons/react/dist/ssr/X";
