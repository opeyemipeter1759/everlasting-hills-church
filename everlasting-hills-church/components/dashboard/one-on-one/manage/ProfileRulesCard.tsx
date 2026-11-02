"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useUpdateHostSettings, type HostDetail, type HostSettingsInput } from "@/lib/api/one-on-one";
import { Select } from "@/components/ui/select";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { Section, Toggle, btnPrimary, input, label, muted } from "./ui";

const BUFFER_OPTIONS = [0, 15, 30, 45, 60].map((m) => ({ value: String(m), label: m === 0 ? "No gap" : `${m} minutes` }));
const CAP_OPTIONS = [1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: n === 1 ? "1 session" : `${n} sessions` }));
const NOTICE_OPTIONS = [
  { value: "12", label: "12 hours ahead" },
  { value: "24", label: "1 day ahead" },
  { value: "48", label: "2 days ahead" },
  { value: "72", label: "3 days ahead" },
  { value: "168", label: "1 week ahead" },
];
const HORIZON_OPTIONS = [
  { value: "14", label: "2 weeks out" },
  { value: "28", label: "4 weeks out" },
  { value: "42", label: "6 weeks out" },
  { value: "56", label: "8 weeks out" },
];
const VISITOR_CAP_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `Up to ${n} a week` }));

type Form = Omit<Required<HostSettingsInput>, "title" | "bio"> & { title: string; bio: string };

function pick(host: HostDetail): Form {
  return {
    displayName: host.displayName,
    title: host.title ?? "",
    bio: host.bio ?? "",
    active: host.active,
    bufferMinutes: host.bufferMinutes,
    dailyCap: host.dailyCap,
    minNoticeHours: host.minNoticeHours,
    horizonDays: host.horizonDays,
    visitorsAllowed: host.visitorsAllowed,
    visitorWeeklyCap: host.visitorWeeklyCap,
  };
}

/** Keeps a custom value selectable even when it isn't one of the presets. */
function withCurrent(options: { value: string; label: string }[], value: number, labelFor: (v: number) => string) {
  return options.some((o) => o.value === String(value)) ? options : [...options, { value: String(value), label: labelFor(value) }];
}

export default function ProfileRulesCard({ host }: { host: HostDetail }) {
  const update = useUpdateHostSettings(host.id);
  const [form, setForm] = useState(() => pick(host));
  useEffect(() => setForm(pick(host)), [host]);

  const dirty = JSON.stringify(form) !== JSON.stringify(pick(host));
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync(form);
      showToast.success("Settings saved");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't save settings."));
    }
  }

  return (
    <Section icon={SlidersHorizontal} eyebrow="What members see" title="Profile and booking rules">
      <form onSubmit={onSave} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Name members see</span>
            <input id="host-name" className={input} value={form.displayName} maxLength={80} onChange={(e) => set("displayName", e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Title</span>
            <input id="host-title" className={input} value={form.title} maxLength={60} placeholder="Senior Pastor" onChange={(e) => set("title", e.target.value)} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className={label}>What you’re best placed to help with</span>
          <textarea
            id="host-bio"
            className={`${input} min-h-[80px] resize-y`}
            maxLength={400}
            placeholder="Direction, calling, leadership and the questions you've been carrying for a while."
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className={label} id="lbl-buffer">Gap between sessions</span>
            <Select aria-labelledby="lbl-buffer" value={String(form.bufferMinutes)} onChange={(v) => set("bufferMinutes", Number(v))} options={withCurrent(BUFFER_OPTIONS, form.bufferMinutes, (m) => `${m} minutes`)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label} id="lbl-cap">Most sessions a day</span>
            <Select aria-labelledby="lbl-cap" value={String(form.dailyCap)} onChange={(v) => set("dailyCap", Number(v))} options={withCurrent(CAP_OPTIONS, form.dailyCap, (n) => `${n} sessions`)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label} id="lbl-notice">Earliest request</span>
            <Select aria-labelledby="lbl-notice" value={String(form.minNoticeHours)} onChange={(v) => set("minNoticeHours", Number(v))} options={withCurrent(NOTICE_OPTIONS, form.minNoticeHours, (h) => `${h} hours ahead`)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={label} id="lbl-horizon">Furthest request</span>
            <Select aria-labelledby="lbl-horizon" value={String(form.horizonDays)} onChange={(v) => set("horizonDays", Number(v))} options={withCurrent(HORIZON_OPTIONS, form.horizonDays, (d) => `${d} days out`)} />
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl bg-[#FFE8ED]/40 p-4 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#111] dark:text-white">Visitors can request time</p>
              <p className={`text-xs ${muted}`}>People who found the messages online and aren’t members yet.</p>
            </div>
            <Toggle id="host-visitors" checked={form.visitorsAllowed} onChange={(v) => set("visitorsAllowed", v)} label="Visitors can request time" />
          </div>
          {form.visitorsAllowed && (
            <div className="flex flex-col gap-1.5 sm:max-w-[16rem]">
              <span className={label} id="lbl-visitor-cap">Visitor sessions</span>
              <Select aria-labelledby="lbl-visitor-cap" value={String(form.visitorWeeklyCap)} onChange={(v) => set("visitorWeeklyCap", Number(v))} options={withCurrent(VISITOR_CAP_OPTIONS, form.visitorWeeklyCap, (n) => `Up to ${n} a week`)} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#111] dark:text-white">Taking requests</p>
            <p className={`text-xs ${muted}`}>Turn off to hide yourself from members and visitors for now.</p>
          </div>
          <Toggle id="host-active" checked={form.active} onChange={(v) => set("active", v)} label="Taking requests" />
        </div>

        <div className="flex justify-end">
          <button type="submit" className={btnPrimary} disabled={!dirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </Section>
  );
}
