"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Megaphone, Plus } from "lucide-react";
import { usePublicFormOptions, useSubmitPublicContact } from "@/lib/api/evangelism";
import { ContactFields } from "@/components/dashboard/evangelism/ContactFields";
import {
  contactInput,
  emptyContactForm,
  validateContactForm,
  type ContactFormErrors,
  type ContactFormState,
} from "@/components/dashboard/evangelism/contact-form";
import { errorText } from "@/components/dashboard/evangelism/labels";

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
    window.localStorage.setItem(
      REMEMBER_KEY,
      JSON.stringify({ workerId: s.workerId, workerOther: s.workerOther, outreachId: s.outreachId }),
    );
  } catch {
    // Private browsing: nothing to remember, nothing lost.
  }
}

export default function EvangelismPublicForm() {
  const options = usePublicFormOptions();
  const submit = useSubmitPublicContact();
  const [form, setForm] = useState<ContactFormState>(() => emptyContactForm());
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [honeypot, setHoneypot] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => setForm((f) => ({ ...f, ...remembered() })), []);

  // A remembered outreach that has since closed shouldn't be sent.
  const outreaches = options.data?.outreaches;
  useEffect(() => {
    if (outreaches && form.outreachId && !outreaches.some((o) => o.id === form.outreachId)) {
      setForm((f) => ({ ...f, outreachId: "" }));
    }
  }, [outreaches, form.outreachId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFailure(null);
    const found = validateContactForm(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    try {
      await submit.mutateAsync({ ...contactInput(form), ...(honeypot ? { website: honeypot } : {}) });
      remember(form);
      setDone(form.name.trim());
      window.scrollTo({ top: 0 });
    } catch (err) {
      setFailure(errorText(err, "Couldn't send. Check your connection and try again — nothing you typed has been lost."));
    }
  }

  function another() {
    setForm(emptyContactForm({ workerId: form.workerId, workerOther: form.workerOther, outreachId: form.outreachId }));
    setErrors({});
    setDone(null);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="space-y-5">
      <header className="rounded-3xl bg-[#87102C] px-5 py-6 text-white shadow-lg shadow-[#87102C]/20">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Everlasting Hills Church</p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold">
          <Megaphone size={22} aria-hidden="true" /> Evangelism Form
        </h1>
        <p className="mt-1.5 text-sm text-white/75">Record everyone you preach to. It goes straight to the Evangelism Team.</p>
      </header>

      {done ? (
        <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
          <CheckCircle2 size={44} className="mx-auto text-emerald-600" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold">Recorded, thank you!</h2>
          <p className="mt-1 text-sm text-gray-500">{done} has been added to the Evangelism Team&apos;s list for follow-up.</p>
          <button
            type="button"
            onClick={another}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#87102C] px-5 text-sm font-bold text-white hover:bg-[#6d0d24]"
          >
            <Plus size={16} aria-hidden="true" /> Submit another
          </button>
        </section>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          {/* Honeypot: people never see or fill this in; bots do. */}
          <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
            <label>
              Website
              <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
            </label>
          </div>

          <ContactFields
            value={form}
            onChange={setForm}
            errors={errors}
            workers={options.data?.workers ?? []}
            outreaches={outreaches ?? []}
            workersLoading={options.isLoading}
          />

          {options.isError && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              Couldn&apos;t load the team list. Choose &ldquo;Other&rdquo; and type your name, or reload when you have signal.
            </p>
          )}
          {failure && (
            <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
              {failure}
            </p>
          )}

          <button
            type="submit"
            disabled={submit.isPending}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#87102C] px-5 text-sm font-bold text-white hover:bg-[#6d0d24] disabled:opacity-60"
          >
            {submit.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {submit.isPending ? "Sending…" : "Submit"}
          </button>
        </form>
      )}

      <p className="text-center text-[11px] text-gray-400">
        Details sent here are seen only by the Evangelism Team and church admins.
      </p>
    </div>
  );
}
