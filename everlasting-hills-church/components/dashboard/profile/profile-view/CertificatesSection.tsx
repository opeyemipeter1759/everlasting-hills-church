"use client";

import ScrollReveal from "@/components/home/ScrollReveal";
import { useClasses } from "@/lib/api/classes";
import { ClassCertificateBadge } from "./ClassCertificateBadge";

/**
 * Section — a badge for every class the member has finished, each linking to its
 * certificate. Fetched client-side (class data isn't part of the server-rendered
 * `/auth/me` payload this page otherwise runs on).
 */
export function CertificatesSection() {
  const { data } = useClasses();
  const completed = (data?.classes ?? []).filter((c) => c.enrollment?.status === "COMPLETED");
  if (completed.length === 0) return null;

  return (
    <ScrollReveal delay={0.05}>
      <section aria-labelledby="certificates-section-title">
        <div className="flex items-center gap-3 mb-5">
          <h2 id="certificates-section-title" className="text-[#87102C] dark:text-white/40 text-xs tracking-[0.1em] xs:tracking-[0.2em] uppercase font-semibold flex-shrink-0">
            Certificates & Badges
          </h2>
          <span aria-hidden="true" className="h-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {completed.map((item) => (
            <ClassCertificateBadge key={item.slug} item={item} />
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}
