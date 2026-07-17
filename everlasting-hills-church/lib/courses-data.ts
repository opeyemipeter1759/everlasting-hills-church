import {
  BookOpen,
  Compass,
  Cross,
  Flame,
  Globe,
  GraduationCap,
  Heart,
  Landmark,
  Music,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

// Courses are admin-authored (see /dashboard/admin/courses). An icon can't be picked
// freely — components can't survive JSON over the wire — so admins choose a key from
// this fixed palette (`iconKey`), resolved back to a component at render time.
export const ICON_OPTIONS: Record<string, LucideIcon> = {
  Cross,
  Flame,
  Heart,
  Landmark,
  ScrollText,
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  Compass,
  Sparkles,
  Star,
  Globe,
  Music,
};

export const GRADIENT_PRESETS: [string, string][] = [
  ["#4a0819", "#87102C"],
  ["#7c2d12", "#c2410c"],
  ["#831843", "#be185d"],
  ["#312e81", "#4f46e5"],
  ["#134e4a", "#0d9488"],
  ["#1e3a8a", "#2563eb"],
  ["#78350f", "#b45309"],
  ["#581c87", "#7e22ce"],
];
