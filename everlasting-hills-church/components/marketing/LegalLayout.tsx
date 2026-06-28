import type { ReactNode } from "react";
import PageHero from "./PageHero";

/**
 * Shared shell for legal/prose pages (Privacy, Terms). Renders the standard
 * page hero plus a constrained, readable prose column.
 */
export default function LegalLayout({
  eyebrow,
  title,
  accent,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-white">
      <PageHero eyebrow={eyebrow} title={title} accent={accent} />
      <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
        <p className="mb-10 text-sm text-[#999]">Last updated: {updated}</p>
        <div className="space-y-8 leading-relaxed text-[#3a3a3a] [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#111] [&_li]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </main>
  );
}
