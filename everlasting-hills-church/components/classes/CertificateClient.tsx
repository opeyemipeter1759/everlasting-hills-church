"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { useCertificate } from "@/lib/api/classes";
import { ClassTheme } from "./theme";
import { ClassError, ClassLoading, formatDate } from "./shared";

export default function CertificateClient({ slug }: { slug: string }) {
  const { data, isLoading, error } = useCertificate(slug);
  if (isLoading) return <ClassTheme><ClassLoading /></ClassTheme>;
  if (error || !data) {
    return (
      <ClassTheme className="px-4 py-10">
        <ClassError error={error} />
        <p className="mt-6 text-center">
          <Link href={`/dashboard/classes/${slug}`} className="cls-btn cls-btn-outline">Back to the class</Link>
        </p>
      </ClassTheme>
    );
  }

  const awaiting = data.grantsMembership && data.membershipStatus !== "FULL";

  return (
    <ClassTheme className="mx-auto max-w-[900px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link href={`/dashboard/classes/${slug}`} className="inline-flex items-center gap-1 text-sm text-black/60 hover:underline dark:text-white/60">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to the class
        </Link>
        <button type="button" onClick={() => window.print()} className="cls-btn cls-btn-outline">
          <Printer className="h-4 w-4" aria-hidden /> Print
        </button>
      </div>

      <article className="cls-glow cls-on-ink relative overflow-hidden rounded-[20px] px-6 py-14 text-center sm:px-14 sm:py-20 print:rounded-none">
        <div className="pointer-events-none absolute inset-4 rounded-[14px] border border-[var(--color-gold)]/40" aria-hidden />
        <p className="cls-eyebrow text-[var(--color-gold)]">Everlasting Hills Church</p>
        <p className="cls-display mt-6 text-2xl text-white/70">This certifies that</p>
        <h1 className="cls-display mt-3 text-4xl sm:text-6xl">{data.name}</h1>
        <p className="mt-6 text-lg text-white/70">has completed the</p>
        <p className="cls-display mt-2 text-3xl sm:text-4xl">
          <em className="cls-em">{data.classTitle}</em>
        </p>
        <p className="mt-6 text-white/60">on {formatDate(data.completedAt)}</p>
        {data.grantsMembership && (
          <p className="mx-auto mt-8 max-w-md text-white/75">
            {awaiting
              ? "Your pastors have been told you are ready. Your full membership is confirmed once a pastor has met with you."
              : `Welcomed as a full member of Everlasting Hills Church${data.membershipConfirmedAt ? ` on ${formatDate(data.membershipConfirmedAt)}` : ""}.`}
          </p>
        )}
        <p className="cls-scripture mt-10 text-sm">Genesis 49:26</p>
        <p className="mt-2 text-sm italic text-white/55">Planted by God, Preserved in Prayer.</p>
      </article>
    </ClassTheme>
  );
}
