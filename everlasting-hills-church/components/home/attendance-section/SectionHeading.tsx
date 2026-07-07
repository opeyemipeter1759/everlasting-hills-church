import { Sparkles } from "lucide-react";

interface SectionHeadingProps {
  eyebrow: string;
  heading: string;
  compact?: boolean;
}

export default function SectionHeading({ eyebrow, heading, compact = false }: SectionHeadingProps) {
  return (
    <div>
      <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-[#FFB3C1]/80">
        <Sparkles size={13} className="text-amber-300" />
        {eyebrow}
      </p>
      <h2
        className={`font-bold leading-[1.05] tracking-tight text-white ${
          compact ? "text-2xl sm:text-3xl md:text-4xl" : "text-3xl sm:text-4xl md:text-5xl"
        }`}
      >
        {heading}
      </h2>
      <div className="mt-5 h-px w-16 bg-white/20" />
    </div>
  );
}
