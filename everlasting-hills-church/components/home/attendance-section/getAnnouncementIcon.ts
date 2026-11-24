import { CalendarDots, Gift, HandHeart, type IconComponent, Megaphone, Users } from "@/components/icons";

const RULES: Array<{ match: RegExp; icon: IconComponent }> = [
  { match: /prayer/i, icon: HandHeart },
  { match: /(service|event|conference|night|revival|program|crusade)/i, icon: CalendarDots },
  { match: /(fellowship|group|youth|women|men|choir|class)/i, icon: Users },
  { match: /(giving|offering|tithe|building|fund)/i, icon: Gift },
];

export function getAnnouncementIcon(title: string): IconComponent {
  return RULES.find((rule) => rule.match.test(title))?.icon ?? Megaphone;
}
