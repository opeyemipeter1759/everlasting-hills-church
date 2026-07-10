import { ShieldCheck } from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import type { ProfileViewModel } from "@/components/dashboard/profile/profile-view-model";
import { ServingChipCard } from "./ServingChipCard";

/**
 * Section 5c — Real, admin-assigned team membership (Unit/UnitMember),
 * distinct from the inferred "ministry group". Read-only; unit assignment
 * is managed by admins, not self-service.
 */
export function ServingSection({ units }: { units: ProfileViewModel["units"] }) {
  return (
    <ScrollReveal delay={0.05}>
      <section aria-labelledby="serving-section-title">
        <div className="flex items-center gap-3 mb-5">
          <h2 id="serving-section-title" className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.2em] uppercase font-semibold flex-shrink-0">
            Serving at EHC
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
        </div>

        {units.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {units.map((unit) => (
              <ServingChipCard key={unit.id} unit={unit} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-white/[0.05] border border-[#E7CDD3]/60 dark:border-white/[0.09] rounded-2xl p-6 sm:p-8 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={17} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#111] dark:text-white">Not yet on a serving team</p>
              <p className="text-xs text-[#8a7e80] dark:text-white/45 mt-1">
                You&rsquo;re not currently assigned to a unit. Speak with a ministry leader if you&rsquo;d like to start serving.
              </p>
            </div>
          </div>
        )}
      </section>
    </ScrollReveal>
  );
}
