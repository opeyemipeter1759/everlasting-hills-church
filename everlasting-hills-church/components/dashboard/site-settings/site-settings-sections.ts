import {
  Globe,
  HelpingHand,
  Images,
  MapPin,
  MessageSquareQuote,
  Mountain,
  Phone,
  Play,
  Quote,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SiteSectionName } from "@/lib/site-settings";

/** Tab label and icon for each homepage section in the editor. */
export const SECTION_META: Record<SiteSectionName, { label: string; icon: LucideIcon }> = {
  HERO: { label: "Hero", icon: Play },
  ABOUT: { label: "About", icon: Sparkles },
  CULTURE: { label: "Culture", icon: Mountain },
  SCRIPTURE: { label: "Scripture", icon: Quote },
  SERVICE: { label: "Services", icon: Globe },
  SERMONS: { label: "Sermons", icon: Play },
  TESTIMONIALS: { label: "Testimonials", icon: MessageSquareQuote },
  COMMUNITY: { label: "Community", icon: Users },
  GIVING: { label: "Giving", icon: HelpingHand },
  CONTACT: { label: "Contact", icon: Phone },
  CAROUSEL: { label: "Carousel", icon: Images },
  DIRECTIONS: { label: "Directions", icon: MapPin },
};

/** Tab order: roughly the order the sections appear on the site. */
export const SECTION_ORDER: SiteSectionName[] = [
  "HERO",
  "ABOUT",
  "CULTURE",
  "SCRIPTURE",
  "SERVICE",
  "SERMONS",
  "TESTIMONIALS",
  "COMMUNITY",
  "GIVING",
  "CONTACT",
  "DIRECTIONS",
  "CAROUSEL",
];
