import Image from "next/image";
import type { ProgramCard } from "@/lib/programs";
import { ACCENT, SERIF } from "./accents";

type Props = {
  program: Pick<ProgramCard, "name" | "accent" | "logoUrl">;
  size?: "card" | "hero";
  /** Shown above the name when there is no logo, so the cover carries the program's identity on its own. */
  eyebrow?: string;
  /** The name is the card's heading when there is no logo. */
  heading?: "h1" | "h3";
};

/**
 * A program's cover: its logo when the pastors have uploaded one, otherwise
 * its name set large in DM Serif Display on a frosted panel lit by its accent.
 * No stock imagery, and nothing heavier than text to download on 4G.
 */
export function Wordmark({ program, size = "card", eyebrow, heading }: Props) {
  const accent = ACCENT[program.accent];
  const hero = size === "hero";
  const Name = heading ?? "span";
  return (
    <div
      className={`relative flex flex-col justify-end overflow-hidden ${hero ? "min-h-[220px] rounded-[28px] p-7 sm:min-h-[300px] sm:p-10" : "min-h-[168px] rounded-[20px] p-5"}`}
      style={{
        // The hero sits straight on the black page, so it gets a solid frosted-white base; a card's cover sits on the card's own white.
        background: `radial-gradient(120% 90% at 85% 10%, rgba(${accent.glow},0.28), transparent 60%), linear-gradient(160deg, rgba(${accent.glow},0.10), rgba(255,255,255,0.65))${hero ? ", rgba(255,255,255,0.94)" : ""}`,
        boxShadow: `inset 0 0 0 1px rgba(${accent.glow},0.14)`,
      }}
    >
      {program.logoUrl ? (
        <Image src={program.logoUrl} alt={`${program.name} logo`} width={hero ? 320 : 160} height={hero ? 160 : 80} sizes={hero ? "320px" : "160px"} className="h-auto max-h-24 w-auto object-contain sm:max-h-32" />
      ) : (
        <>
          {eyebrow && <p className="mb-3 text-[11.5px] font-semibold tracking-[0.12em] text-brand-muted">{eyebrow}</p>}
          <Name aria-hidden={heading ? undefined : true} className={`${SERIF} block leading-[0.98] tracking-[-0.01em] ${hero ? "text-[52px] sm:text-[80px]" : "text-[36px]"}`} style={{ color: accent.ink }}>
            {program.name}
          </Name>
        </>
      )}
    </div>
  );
}
