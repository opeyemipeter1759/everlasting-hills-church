import ScrollReveal from "@/components/home/ScrollReveal";

/** The CMS-editable "Who it's for" line on a ministry page. */
export default function WhoItsFor({ who }: { who?: string | null }) {
  if (!who) return null;
  return (
    <ScrollReveal delay={0.25}>
      <div className="mt-6 rounded-2xl border border-[#E7CDD3] bg-[#FFF6F8] px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#87102C]">Who it&apos;s for</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#555] sm:text-base">{who}</p>
      </div>
    </ScrollReveal>
  );
}
