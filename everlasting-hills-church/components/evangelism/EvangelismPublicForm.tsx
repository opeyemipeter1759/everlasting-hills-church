"use client";

import { useEffect, useRef, useState } from "react";
import { Combobox } from "@/components/ui/form/Combobox";
import { Select } from "@/components/ui/select";
import { usePublicFormOptions, useSubmitPublicContact, type NextAction, type SavedStatus } from "@/lib/api/evangelism";
import {
  OTHER_WORKER,
  contactInput,
  emptyContactForm,
  validateContactForm,
  type ContactFormErrors,
  type ContactFormState,
} from "@/components/dashboard/evangelism/contact-form";
import { NEXT_ACTION_LABEL, errorText, todayLagos } from "@/components/dashboard/evangelism/labels";

/**
 * The outreach form, in the same step-by-step flow as the first-timer form:
 * a progress bar, one white card per step, Back / Continue underneath.
 */

const STEPS = ["Outreach", "Person", "Response", "Follow-up"] as const;

// Which answers each step checks before moving on.
const STEP_FIELDS: (keyof ContactFormState)[][] = [
  ["workerId", "workerOther", "contactDate"],
  ["name", "phone", "address"],
  ["savedStatus", "isStudent", "school"],
  [],
];

/** Remembered on this phone between submissions: the worker and outreach rarely change mid-outreach. */
const REMEMBER_KEY = "ehc-evangelism-form";

function remembered(): Partial<ContactFormState> {
  try {
    const raw = window.localStorage.getItem(REMEMBER_KEY);
    if (!raw) return {};
    const saved = JSON.parse(raw) as Partial<ContactFormState>;
    return { workerId: saved.workerId ?? "", workerOther: saved.workerOther ?? "", outreachId: saved.outreachId ?? "" };
  } catch {
    return {};
  }
}

function remember(s: ContactFormState) {
  try {
    window.localStorage.setItem(REMEMBER_KEY, JSON.stringify({ workerId: s.workerId, workerOther: s.workerOther, outreachId: s.outreachId }));
  } catch {
    // Private browsing: nothing to remember, nothing lost.
  }
}

// ── Field styles, as on the first-timer form ──────────────────────────────────

function ic(hasError?: boolean) {
  return (
    "w-full px-4 py-3 rounded-xl border text-sm text-gray-900 bg-white " +
    "placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all duration-150 [color-scheme:light] " +
    (hasError
      ? "border-red-400 focus:border-red-500 focus:ring-red-200/50"
      : "border-gray-200 focus:border-church-maroon focus:ring-church-maroon/20")
  );
}

function Label({ htmlFor, required, children }: { htmlFor?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-700">
      {children}
      {required && (
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500" role="alert">
      <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </p>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 border-b border-gray-100 pb-6">
      <h2 className="mb-1 text-2xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function RadioCard({
  name,
  value,
  label,
  checked,
  hasError,
  onSelect,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  hasError?: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={
        "relative flex cursor-pointer select-none items-center gap-3 rounded-xl border-2 p-3.5 transition-all duration-150 " +
        "hover:border-gray-300 has-[:checked]:border-church-maroon has-[:checked]:bg-[#FFF4F6] " +
        (hasError ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-white")
      }
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="h-4 w-4 flex-shrink-0 cursor-pointer accent-church-maroon"
      />
      <span className="text-sm font-medium leading-snug text-gray-800">{label}</span>
    </label>
  );
}

const SAVED_OPTIONS: { value: SavedStatus; label: string }[] = [
  { value: "YES", label: "Yes, they gave their life to Christ" },
  { value: "NO", label: "No, not yet" },
  { value: "ALREADY", label: "They were already saved" },
];

// ── The form ──────────────────────────────────────────────────────────────────

export default function EvangelismPublicForm() {
  const options = usePublicFormOptions();
  const submit = useSubmitPublicContact();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ContactFormState>(() => emptyContactForm());
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [honeypot, setHoneypot] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  // Set the moment a send starts, before any re-render: a double tap, or a
  // tap while the first send is still on its way, must not record them twice.
  const sending = useRef(false);

  useEffect(() => setForm((f) => ({ ...f, ...remembered() })), []);

  // A remembered outreach that has since closed shouldn't be sent.
  const outreaches = options.data?.outreaches;
  useEffect(() => {
    if (outreaches && form.outreachId && !outreaches.some((o) => o.id === form.outreachId)) {
      setForm((f) => ({ ...f, outreachId: "" }));
    }
  }, [outreaches, form.outreachId]);

  const set = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function stepErrors(i: number): ContactFormErrors {
    const all = validateContactForm(form);
    return Object.fromEntries(Object.entries(all).filter(([k]) => STEP_FIELDS[i].includes(k as keyof ContactFormState)));
  }

  function next() {
    const found = stepErrors(step);
    setErrors(found);
    if (Object.keys(found).length) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();
    setFailure(null);
    // Everything, in case an earlier answer was cleared on the way.
    const all = validateContactForm(form);
    if (Object.keys(all).length) {
      setErrors(all);
      const first = STEP_FIELDS.findIndex((fields) => fields.some((f) => f in all));
      if (first >= 0) setStep(first);
      return;
    }
    if (sending.current) return;
    sending.current = true;
    try {
      await submit.mutateAsync({ ...contactInput(form), ...(honeypot ? { website: honeypot } : {}) });
      remember(form);
      setDone(form.name.trim());
      window.scrollTo({ top: 0 });
    } catch (err) {
      sending.current = false; // Let them try again.
      setFailure(errorText(err, "Couldn't send. Check your connection and try again — nothing you typed has been lost."));
    }
  }

  function another() {
    sending.current = false;
    setForm(emptyContactForm({ workerId: form.workerId, workerOther: form.workerOther, outreachId: form.outreachId, contactDate: form.contactDate }));
    setErrors({});
    setDone(null);
    setStep(1); // Straight to the next person; Back still reaches the outreach.
    window.scrollTo({ top: 0 });
  }

  if (done) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#FFE8ED]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#87102C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-white">Recorded, thank you!</h1>
          <p className="text-sm leading-relaxed text-white/60">
            {done} has been added to the Evangelism Team&apos;s list for follow-up.
          </p>
          <button
            type="button"
            onClick={another}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-church-maroon to-burgundy-light py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-burgundy-dark hover:to-church-maroon active:scale-95"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);
  const workers = options.data?.workers ?? [];

  return (
    <>
      {/* Header */}
      <div className="mb-8 mt-20 text-center">
        <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Evangelism Form</h1>
        <p className="text-sm text-white/50">Record everyone you preach to — it goes straight to the Evangelism Team</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="mb-3 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i < step ? "bg-church-maroon" : i === step ? "bg-gradient-to-r from-church-maroon to-burgundy-light" : "bg-white/15"
              }`}
            />
          ))}
        </div>
        <div className="hidden justify-between sm:flex">
          {STEPS.map((label, i) => (
            <span key={label} className={`text-[11px] font-medium transition-colors ${i <= step ? "text-white/60" : "text-white/25"}`}>
              {label}
            </span>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between sm:hidden">
          <p className="text-xs text-white/50">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
          <p className="text-xs text-white/40">{progress}%</p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate>
        {/* Honeypot: people never see or fill this in; bots do. */}
        <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>

        <div className="mb-5 rounded-3xl bg-white p-4 shadow-2xl xs:p-6 sm:p-10">
          {step === 0 && (
            <div className="space-y-5">
              <StepHeader title="Your outreach 🙌" subtitle="Who's preaching, and where. We'll remember this on your phone for the next person." />
              <div>
                <Label required>Your name (the worker who preached)</Label>
                <Combobox
                  options={[...workers.map((w) => ({ id: w.id, label: w.name })), { id: OTHER_WORKER, label: "Other (type a name)" }]}
                  value={form.workerId}
                  onChange={(id) => set("workerId", id)}
                  placeholder="Choose your name"
                  searchPlaceholder="Search the team…"
                  loading={options.isLoading}
                  triggerClassName={ic(!!errors.workerId)}
                />
                <FieldError message={errors.workerId} />
                {options.isError && (
                  <p className="mt-1.5 text-xs text-amber-700">Couldn&apos;t load the team list. Choose &ldquo;Other&rdquo; and type your name.</p>
                )}
              </div>
              {form.workerId === OTHER_WORKER && (
                <div>
                  <Label htmlFor="ev-worker-other" required>
                    Worker&apos;s name
                  </Label>
                  <input
                    id="ev-worker-other"
                    className={ic(!!errors.workerOther)}
                    value={form.workerOther}
                    onChange={(e) => set("workerOther", e.target.value)}
                    placeholder="e.g. Tunde Bakare"
                    maxLength={120}
                  />
                  <FieldError message={errors.workerOther} />
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Outreach</Label>
                  <Select
                    aria-label="Outreach"
                    className={ic()}
                    value={form.outreachId}
                    onChange={(v) => set("outreachId", v)}
                    options={[{ value: "", label: "Personal evangelism" }, ...(outreaches ?? []).map((o) => ({ value: o.id, label: o.name }))]}
                  />
                </div>
                <div>
                  <Label htmlFor="ev-date" required>
                    Date of contact
                  </Label>
                  <input
                    id="ev-date"
                    type="date"
                    className={ic(!!errors.contactDate)}
                    value={form.contactDate}
                    max={todayLagos()}
                    onChange={(e) => set("contactDate", e.target.value)}
                  />
                  <FieldError message={errors.contactDate} />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <StepHeader title="Who did you preach to?" subtitle="Their details are seen only by the Evangelism Team and church admins." />
              <div>
                <Label htmlFor="ev-name" required>
                  Full name
                </Label>
                <input
                  id="ev-name"
                  className={ic(!!errors.name)}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Chinedu Okeke"
                  autoComplete="off"
                  maxLength={120}
                />
                <FieldError message={errors.name} />
              </div>
              <div>
                <Label htmlFor="ev-phone" required>
                  Phone number
                </Label>
                <input
                  id="ev-phone"
                  type="tel"
                  inputMode="tel"
                  className={ic(!!errors.phone)}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="e.g. 08012345678"
                  autoComplete="off"
                  maxLength={24}
                />
                <FieldError message={errors.phone} />
              </div>
              <div>
                <Label htmlFor="ev-address" required>
                  Address
                </Label>
                <input
                  id="ev-address"
                  className={ic(!!errors.address)}
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="e.g. 12 Adeola Street, Bodija"
                  autoComplete="off"
                  maxLength={300}
                />
                <FieldError message={errors.address} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <StepHeader title="Their response" subtitle="How they received the Gospel today." />
              <fieldset>
                <legend className="mb-2 block text-sm font-medium text-gray-700">
                  Did they give their life to Christ?<span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
                </legend>
                <div className="grid grid-cols-1 gap-3">
                  {SAVED_OPTIONS.map((o) => (
                    <RadioCard
                      key={o.value}
                      name="savedStatus"
                      value={o.value}
                      label={o.label}
                      checked={form.savedStatus === o.value}
                      hasError={!!errors.savedStatus}
                      onSelect={() => set("savedStatus", o.value)}
                    />
                  ))}
                </div>
                <FieldError message={errors.savedStatus} />
              </fieldset>
              <fieldset>
                <legend className="mb-2 block text-sm font-medium text-gray-700">
                  Are they a student?<span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  {(["yes", "no"] as const).map((v) => (
                    <RadioCard
                      key={v}
                      name="isStudent"
                      value={v}
                      label={v === "yes" ? "Yes" : "No"}
                      checked={form.isStudent === v}
                      hasError={!!errors.isStudent}
                      onSelect={() => set("isStudent", v)}
                    />
                  ))}
                </div>
                <FieldError message={errors.isStudent} />
              </fieldset>
              {form.isStudent === "yes" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="ev-school" required>
                      School name
                    </Label>
                    <input
                      id="ev-school"
                      className={ic(!!errors.school)}
                      value={form.school}
                      onChange={(e) => set("school", e.target.value)}
                      placeholder="e.g. University of Ibadan"
                      maxLength={160}
                    />
                    <FieldError message={errors.school} />
                  </div>
                  <div>
                    <Label htmlFor="ev-level">Level / class</Label>
                    <input
                      id="ev-level"
                      className={ic()}
                      value={form.level}
                      onChange={(e) => set("level", e.target.value)}
                      placeholder="e.g. 200 Level, SS2"
                      maxLength={60}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <StepHeader title="Follow-up" subtitle="Help the team take it from here." />
              <div>
                <Label htmlFor="ev-discussion">Brief discussion</Label>
                <textarea
                  id="ev-discussion"
                  rows={5}
                  className={`${ic()} resize-none`}
                  value={form.discussion}
                  onChange={(e) => set("discussion", e.target.value)}
                  placeholder="What was discussed, their response, prayer requests, needs…"
                  maxLength={4000}
                />
              </div>
              <fieldset>
                <legend className="mb-2 block text-sm font-medium text-gray-700">Next action needed</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(Object.keys(NEXT_ACTION_LABEL) as NextAction[]).map((k) => (
                    <RadioCard
                      key={k}
                      name="nextAction"
                      value={k}
                      label={NEXT_ACTION_LABEL[k]}
                      checked={form.nextAction === k}
                      onSelect={() => set("nextAction", k)}
                    />
                  ))}
                </div>
              </fieldset>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-gray-200 bg-white p-3.5 transition-colors has-[:checked]:border-church-maroon has-[:checked]:bg-[#FFF4F6]">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 accent-church-maroon"
                />
                <span className="text-sm leading-snug text-gray-800">The person agreed to be contacted by the church</span>
              </label>
            </div>
          )}
        </div>

        {failure && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
            <p role="alert" className="text-sm text-red-400">
              {failure}
            </p>
          </div>
        )}

        <div className="flex gap-3 sm:gap-4">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="flex-1 rounded-xl border-2 border-white/20 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/40 hover:bg-white/10 active:scale-95"
            >
              ← Back
            </button>
          )}
          {/* Keyed so Continue and Submit are different elements: if React reused
              one <button> it would flip it to type="submit" mid-tap on the last
              Continue, and the browser would send the form before step 4. */}
          {step < STEPS.length - 1 ? (
            <button
              key="continue"
              type="button"
              onClick={next}
              className="flex-1 rounded-xl bg-gradient-to-r from-church-maroon to-burgundy-light py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-burgundy-dark hover:to-church-maroon hover:shadow-xl active:scale-95"
            >
              Continue →
            </button>
          ) : (
            <button
              key="submit"
              type="submit"
              disabled={submit.isPending}
              className="flex-1 rounded-xl bg-gradient-to-r from-church-maroon to-burgundy-light py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-burgundy-dark hover:to-church-maroon hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              {submit.isPending ? "Submitting…" : "Submit ✓"}
            </button>
          )}
        </div>
      </form>
    </>
  );
}
