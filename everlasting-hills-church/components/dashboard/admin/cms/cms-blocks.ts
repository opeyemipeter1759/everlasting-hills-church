import {
  Heading, Type, Image as ImageIcon, Quote, List, Minus,
  Video, MousePointerClick, Mic, CalendarDays, type LucideIcon,
} from "lucide-react";

/**
 * Frontend mirror of the backend Zod block schema
 * (ehc-backend/src/cms/schemas/blocks.schema.ts). A page's content is
 * { blocks: Block[] } — a portable, constrained block array. No arbitrary HTML.
 */
export type Block =
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "image"; mediaId?: string | null; r2Key?: string | null; url?: string | null; alt: string; caption?: string }
  | { id: string; type: "quote"; text: string; cite?: string }
  | { id: string; type: "list"; ordered: boolean; items: string[] }
  | { id: string; type: "divider" }
  | { id: string; type: "video"; url: string }
  | { id: string; type: "cta"; label: string; href: string }
  | { id: string; type: "featuredSermon"; sermonId: string | null }
  | { id: string; type: "featuredEvent"; eventId: string | null };

export type BlockType = Block["type"];

export interface BlockMeta {
  type: BlockType;
  label: string;
  icon: LucideIcon;
}

export const BLOCK_MENU: BlockMeta[] = [
  { type: "heading", label: "Heading", icon: Heading },
  { type: "paragraph", label: "Paragraph", icon: Type },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "quote", label: "Quote", icon: Quote },
  { type: "list", label: "List", icon: List },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "video", label: "Video", icon: Video },
  { type: "cta", label: "Button (CTA)", icon: MousePointerClick },
  { type: "featuredSermon", label: "Featured sermon", icon: Mic },
  { type: "featuredEvent", label: "Featured event", icon: CalendarDays },
];

function uid() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `b_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function createBlock(type: BlockType): Block {
  const id = uid();
  switch (type) {
    case "heading": return { id, type, level: 2, text: "" };
    case "paragraph": return { id, type, text: "" };
    case "image": return { id, type, r2Key: null, url: null, alt: "", caption: "" };
    case "quote": return { id, type, text: "", cite: "" };
    case "list": return { id, type, ordered: false, items: [""] };
    case "divider": return { id, type };
    case "video": return { id, type, url: "" };
    case "cta": return { id, type, label: "", href: "" };
    case "featuredSermon": return { id, type, sermonId: null };
    case "featuredEvent": return { id, type, eventId: null };
  }
}

export function blockLabel(type: BlockType): string {
  return BLOCK_MENU.find((b) => b.type === type)?.label ?? type;
}
