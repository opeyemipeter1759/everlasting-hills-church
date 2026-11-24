import type { ComponentType } from "react";
import type { IconProps, IconWeight } from "@phosphor-icons/react/dist/lib/types";

/** Any glyph exported from "@/components/icons". */
export type IconComponent = ComponentType<IconProps>;
export type { IconWeight };

type Props = Omit<IconProps, "size" | "weight"> & {
  /** The glyph, imported from "@/components/icons", never straight from the library. */
  icon: IconComponent;
  size?: number | string;
  /** "duotone" in menus, "regular" or "light" for inline interface icons. */
  weight?: IconWeight;
  /** A spoken name, only for an icon that stands alone (an icon-only button has its own label instead). */
  label?: string;
};

/**
 * The one way the public site draws an icon, so size, weight, colour and
 * accessibility stay the same everywhere: 20px, regular weight, the current
 * text colour (set it with a text-* class), and hidden from screen readers
 * unless it is given a label. No "use client": it renders in server
 * components too.
 */
export function Icon({ icon: Glyph, size = 20, weight = "regular", label, ...rest }: Props) {
  if (label) return <Glyph size={size} weight={weight} role="img" aria-label={label} focusable="false" {...rest} />;
  return <Glyph size={size} weight={weight} aria-hidden="true" focusable="false" {...rest} />;
}
