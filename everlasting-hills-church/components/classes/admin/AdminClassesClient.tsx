"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminClasses } from "@/lib/api/classes";
import { ClassTheme } from "../theme";
import { ClassError, ClassLoading } from "../shared";
import ApprovalsTab from "./ApprovalsTab";
import CohortsTab from "./CohortsTab";
import ContentTab from "./ContentTab";
import StalledTab from "./StalledTab";

const TABS = [
  ["approvals", "Ready for membership"],
  ["cohorts", "Cohorts"],
  ["content", "Lessons"],
  ["stalled", "Stalled"],
] as const;
type Tab = (typeof TABS)[number][0];

export default function AdminClassesClient() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (TABS.find(([t]) => t === params.get("tab"))?.[0] ?? "approvals") as Tab;
  const { data: classes, isLoading, error, refetch } = useAdminClasses();
  const [courseId, setCourseId] = useState<string>("");

  useEffect(() => {
    if (!courseId && classes?.length) setCourseId(classes[0].id);
  }, [classes, courseId]);

  const current = classes?.find((c) => c.id === courseId);

  return (
    <ClassTheme className="mx-auto max-w-[1200px] px-4 py-8">
      <p className="cls-eyebrow text-[var(--color-burgundy)] dark:text-[var(--color-gold)]">Administration</p>
      <h1 className="cls-display mt-1 text-4xl text-[var(--color-ink)] dark:text-white">Classes</h1>

      {isLoading && <ClassLoading />}
      {error && <div className="mt-6"><ClassError error={error} onRetry={() => refetch()} /></div>}
      {classes && classes.length === 0 && (
        <p className="mt-6 text-black/60 dark:text-white/60">
          No classes yet. Run the Membership Class seed (scripts/seed-membership-class.ts) to create it.
        </p>
      )}

      {classes && classes.length > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {classes.length > 1 && (
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="rounded-[12px] border border-[var(--color-pink-border)] bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                aria-label="Class"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            )}
            {current && (
              <p className="text-sm text-black/60 dark:text-white/60">
                {current.title}: {current.lessons} lessons · {current.cohorts} cohort{current.cohorts === 1 ? "" : "s"} · {current.learners.active} active,{" "}
                {current.learners.waiting} waiting, {current.learners.completed} completed
              </p>
            )}
          </div>

          <div role="tablist" className="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--color-pink-border)] dark:border-white/10">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={tab === key}
                onClick={() => router.replace(`/dashboard/admin/classes?tab=${key}`, { scroll: false })}
                className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  tab === key
                    ? "border-[var(--color-burgundy)] text-[var(--color-burgundy)] dark:border-[var(--color-gold)] dark:text-[var(--color-gold)]"
                    : "border-transparent text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "approvals" && <ApprovalsTab />}
            {tab === "cohorts" && courseId && <CohortsTab courseId={courseId} />}
            {tab === "content" && courseId && <ContentTab courseId={courseId} />}
            {tab === "stalled" && <StalledTab />}
          </div>
        </>
      )}
    </ClassTheme>
  );
}
