import ScrollReveal from "@/components/home/ScrollReveal";
import type { MinistryInfo } from "./ministries";
import { MinistryChipCard } from "./MinistryChipCard";

/**
 * Section 5b — Ministry group, computed from gender + age + marital status.
 * Quietly omitted (by the caller) when there are no matching ministries.
 */
export function MinistrySection({ ministries }: { ministries: MinistryInfo[] }) {
  return (
    <ScrollReveal delay={0.05}>
      <section aria-labelledby="ministry-section-title">
        <div className="flex items-center gap-3 mb-5">
          <h2 id="ministry-section-title" className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0">
            Your ministry group
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ministries.map((ministry) => (
            <MinistryChipCard key={ministry.slug} ministry={ministry} />
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
