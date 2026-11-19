"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { usePreMaritalApplication, useUpdatePreMaritalStatus, type Application } from "@/lib/api/pre-marital";
import { STATUS_OPTIONS, relationshipLabel, statusLabel, type ApplicationStatus } from "@/lib/pre-marital/schema";
import { StatusBadge, coupleName, longDate } from "./StatusBadge";

function Row({ label, value, href }: { label: string; value: string | null; href?: string }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[12rem_1fr] sm:gap-3">
      <dt className="text-sm text-gray-500 dark:text-white/50">{label}</dt>
      <dd className="min-w-0 break-words text-sm text-[#111] dark:text-white/90">
        {value ? href ? <a href={href} className="text-[#87102C] underline-offset-2 hover:underline dark:text-[#f3a9b8]">{value}</a> : value : "Not given"}
      </dd>
    </div>
  );
}

function Person({ title, a, who }: { title: string; a: Application; who: "groom" | "bride" }) {
  const p = (k: string) => a[`${who}${k}` as keyof Application] as string | boolean;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#161618]">
      <h2 className="text-base font-bold text-[#111] dark:text-white">{title}</h2>
      <dl className="mt-1 divide-y divide-gray-100 dark:divide-white/[0.06]">
        <Row label="Name" value={`${p("FirstName")} ${p("LastName")}`} />
        <Row label="Phone" value={p("Phone") as string} href={`tel:${String(p("Phone")).replace(/\s/g, "")}`} />
        <Row label="Email" value={p("Email") as string} href={`mailto:${p("Email")}`} />
        <Row label="Member of Everlasting Hills" value={p("IsMember") ? "Yes" : "No"} />
      </dl>
    </section>
  );
}

/** One application in full, with its status to set. */
export default function ApplicationDetail({ id }: { id: string }) {
  const q = usePreMaritalApplication(id);
  const update = useUpdatePreMaritalStatus(id);
  const a = q.data;

  async function setStatus(next: string) {
    if (!a || next === a.status) return;
    try {
      await update.mutateAsync(next as ApplicationStatus);
      showToast.success(`Marked ${statusLabel(next as ApplicationStatus).toLowerCase()}`);
    } catch (err) {
      showToast.error((err as ApiError).message || "The status did not change. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
      <Link href="/dashboard/pastor/pre-marital-counselling" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#111] dark:text-white/60 dark:hover:text-white">
        <ArrowLeft size={16} aria-hidden="true" /> All applications
      </Link>

      {q.isLoading && <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" aria-label="Loading the application" />}
      {q.isError && (
        <p className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          {(q.error as ApiError).status === 404 ? "This application was not found." : (q.error as ApiError).status === 403 ? "Only the pastoral team can see this application." : "The application could not be loaded. Try again."}
        </p>
      )}

      {a && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#161618]">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#111] dark:text-white">{coupleName(a)}</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-white/60">
                Applied {longDate(a.submittedAt)} · Reference {a.referenceCode}
              </p>
              {a.statusUpdatedAt && (
                <p className="mt-1 text-xs text-gray-500 dark:text-white/45">
                  Status set by {a.statusUpdatedByName ?? "a team member"} on {longDate(a.statusUpdatedAt)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={a.status} />
              <Select
                value={a.status}
                onChange={setStatus}
                disabled={update.isPending}
                options={[...STATUS_OPTIONS]}
                prefixLabel="Status"
                aria-label="Application status"
                className="min-h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm text-[#111] dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            </div>
          </header>

          <Person title="The groom-to-be" a={a} who="groom" />
          <Person title="The bride-to-be" a={a} who="bride" />

          <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#161618]">
            <h2 className="text-base font-bold text-[#111] dark:text-white">The two of them</h2>
            <dl className="mt-1 divide-y divide-gray-100 dark:divide-white/[0.06]">
              <Row label="Planned wedding date" value={a.weddingDate ? longDate(a.weddingDate) : null} />
              <Row label="Known each other" value={relationshipLabel(a.relationshipLength)} />
              <Row label="For the pastors" value={a.message} />
            </dl>
          </section>
        </>
      )}
    </div>
  );
}
