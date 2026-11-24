import { Icon, type IconComponent } from "@/components/icons";

const FADE = "absolute inset-0 transition-opacity duration-150 ease-out motion-reduce:transition-none";

/**
 * A menu item's icon in burgundy: duotone at rest, filled on hover, on keyboard
 * focus and for the page you are on. The two weights are separate drawings, so
 * they cross-fade over 150ms rather than morph; with reduced motion the swap is
 * instant. Needs a `group` parent (the row).
 *
 * The box is nudged up 2px so the icon centres on the title's capital letters,
 * not on the title and description together.
 */
export function MenuGlyph({ icon, active, size = 24 }: { icon: IconComponent; active: boolean; size?: number }) {
  return (
    <span aria-hidden="true" className="relative -mt-0.5 block shrink-0 text-burgundy" style={{ width: size, height: size }}>
      <Icon
        icon={icon}
        size={size}
        weight="duotone"
        className={`${FADE} ${active ? "opacity-0" : "group-hover:opacity-0 group-focus-visible:opacity-0"}`}
      />
      <Icon
        icon={icon}
        size={size}
        weight="fill"
        className={`${FADE} ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
      />
    </span>
  );
}
