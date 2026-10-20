"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useClassHome, useEnroll, type ApplicationForm } from "@/lib/api/classes";
import { showToast } from "@/components/ui/toast/toast";
import { ClassTheme } from "./theme";
import Arches from "./Arches";
import { ClassError, ClassLoading, errorText } from "./shared";

const ATTENDING: { value: ApplicationForm["attendingFor"]; label: string }[] = [
  { value: "under_1_month", label: "Less than a month" },
  { value: "1_to_3_months", label: "1 to 3 months" },
  { value: "3_to_12_months", label: "3 to 12 months" },
  { value: "over_1_year", label: "More than a year" },
];

const field = "mt-2 w-full rounded-[12px] border border-[var(--color-pink-border)] bg-white px-4 py-3 text-base text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-burgundy)]/40 dark:border-white/15 dark:bg-white/[0.04] dark:text-white";
const label = "block font-semibold text-[var(--color-ink)] dark:text-white";
const hint = "mt-1 block text-sm text-black/55 dark:text-white/55";

/** The application to join a class. A Super Admin, Pastor or Admin Head reads it and decides. */
export default function ApplyClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: home, isLoading, error, refetch } = useClassHome(slug);
  const enroll = useEnroll(slug);
  const [form, setForm] = useState<ApplicationForm>({ reason: "", attendingFor: "1_to_3_months", bornAgain: "yes", homeCell: "", notes: "", commitment: false });
  const set = <K extends keyof ApplicationForm>(k: K, v: ApplicationForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  if (isLoading) return <ClassTheme><ClassLoading /></ClassTheme>;
  if (error || !home) return <ClassTheme className="px-4 py-10"><ClassError error={error} onRetry={() => refetch()} /></ClassTheme>;

  const back = `/dashboard/classes/${slug}`;
  const e = home.enrollment;
  const already = e && e.status !== "DECLINED";
  const reasonOk = form.reason.trim().length >= 20;
  const ready = reasonOk && form.commitment && !enroll.isPending;

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!ready) return;
    try {
      await enroll.mutateAsync({ ...form, reason: form.reason.trim(), homeCell: form.homeCell?.trim() || undefined, notes: form.notes?.trim() || undefined });
      showToast.success("Application sent. You will hear back in your inbox.");
      router.push(back);
    } catch (err) {
      showToast.error(errorText(err, "Could not send your application"));
    }
  }

  return (
    <ClassTheme className="mx-auto max-w-[760px] px-4 py-8 sm:py-12">
      <Link href={back} className="inline-flex items-center gap-1.5 text-sm text-black/60 hover:text-[var(--color-burgundy)] dark:text-white/60">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {home.class.title}
      </Link>

      <header className="cls-glow cls-on-ink relative mt-6 overflow-hidden rounded-[24px] px-6 py-10 sm:px-10">
        <Arches className="absolute -bottom-2 right-0 h-[90%] w-auto text-white" />
        <p className="relative text-sm text-white/60">Apply to join</p>
        <h1 className="cls-display relative mt-2 text-4xl sm:text-5xl">{home.class.title}</h1>
        <p className="relative mt-3 max-w-lg text-white/65">
          Tell us a little about you. A Super Admin, Pastor or Admin Head reads every application, and you will get a message in your inbox when it is decided.
        </p>
      </header>

      {already ? (
        <div className="mt-8 rounded-[20px] border border-[var(--color-pink-border)] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="cls-display text-2xl text-[var(--color-ink)] dark:text-white">{e?.status === "PENDING" ? "Your application is with the pastors." : "You are already in this class."}</p>
          <Link href={back} className="cls-btn cls-btn-primary mt-5">Back to the class</Link>
        </div>
      ) : home.blocker ? (
        <div className="mt-8 rounded-[20px] border border-[var(--color-pink-border)] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-[var(--color-ink)] dark:text-white">{home.blocker}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-7 rounded-[24px] border border-[var(--color-pink-border)] bg-white p-6 dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
          {e?.status === "DECLINED" && e.decisionNote && (
            <p className="rounded-[14px] bg-[var(--color-blush)] p-4 text-sm text-black/70 dark:bg-white/[0.06] dark:text-white/75">Last time the pastors said: {e.decisionNote}</p>
          )}
          <div>
            <label htmlFor="reason" className={label}>Why do you want to join this class?</label>
            <span className={hint}>A few sentences is plenty.</span>
            <textarea id="reason" required rows={4} maxLength={1000} value={form.reason} onChange={(ev) => set("reason", ev.target.value)} className={field} />
          </div>

          <fieldset>
            <legend className={label}>How long have you been worshipping with us?</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ATTENDING.map((o) => (
                <label key={o.value} className={`flex cursor-pointer items-center gap-3 rounded-[12px] border p-3 ${form.attendingFor === o.value ? "border-[var(--color-burgundy)] bg-[var(--color-chip)] dark:bg-white/[0.08]" : "border-[var(--color-pink-border)] dark:border-white/10"}`}>
                  <input type="radio" name="attendingFor" checked={form.attendingFor === o.value} onChange={() => set("attendingFor", o.value)} className="accent-[var(--color-burgundy)]" />
                  <span className="text-[var(--color-ink)] dark:text-white">{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={label}>Have you given your life to Jesus?</legend>
            <span className={hint}>Either answer is welcome. If you are not sure, we may also point you to the Believers Class.</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {([["yes", "Yes"], ["not_sure", "I am not sure yet"]] as const).map(([v, l]) => (
                <label key={v} className={`flex cursor-pointer items-center gap-3 rounded-[12px] border px-4 py-3 ${form.bornAgain === v ? "border-[var(--color-burgundy)] bg-[var(--color-chip)] dark:bg-white/[0.08]" : "border-[var(--color-pink-border)] dark:border-white/10"}`}>
                  <input type="radio" name="bornAgain" checked={form.bornAgain === v} onChange={() => set("bornAgain", v)} className="accent-[var(--color-burgundy)]" />
                  <span className="text-[var(--color-ink)] dark:text-white">{l}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="homeCell" className={label}>Your Home Cell <span className="font-normal text-black/50 dark:text-white/50">(optional)</span></label>
            <input id="homeCell" maxLength={120} value={form.homeCell ?? ""} onChange={(ev) => set("homeCell", ev.target.value)} className={field} />
          </div>

          <div>
            <label htmlFor="notes" className={label}>Anything the pastors should know? <span className="font-normal text-black/50 dark:text-white/50">(optional)</span></label>
            <textarea id="notes" rows={3} maxLength={1000} value={form.notes ?? ""} onChange={(ev) => set("notes", ev.target.value)} className={field} />
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={form.commitment} onChange={(ev) => set("commitment", ev.target.checked)} className="mt-1 h-5 w-5 accent-[var(--color-burgundy)]" />
            <span className="text-[var(--color-ink)] dark:text-white">I will attend the Sunday sessions and complete every lesson.</span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-pink-border)] pt-6 dark:border-white/10">
            <p className="text-sm text-black/55 dark:text-white/55">{!reasonOk ? "Tell us why you want to join (at least 20 characters)." : !form.commitment ? "Tick the commitment to send." : "Ready to send."}</p>
            <button type="submit" disabled={!ready} className="cls-btn cls-btn-primary">
              {enroll.isPending ? "Sending..." : "Send application"}
            </button>
          </div>
        </form>
      )}
    </ClassTheme>
  );
}
