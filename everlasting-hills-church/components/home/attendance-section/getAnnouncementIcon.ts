import { CalendarDays, Gift, HeartHandshake, Megaphone, Users, type LucideIcon } from "lucide-react";

const RULES: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /prayer/i, icon: HeartHandshake },
  { match: /(service|event|conference|night|revival|program|crusade)/i, icon: CalendarDays },
  { match: /(fellowship|group|youth|women|men|choir|class)/i, icon: Users },
  { match: /(giving|offering|tithe|building|fund)/i, icon: Gift },
];

export function getAnnouncementIcon(title: string): LucideIcon {
  return RULES.find((rule) => rule.match.test(title))?.icon ?? Megaphone;
}
