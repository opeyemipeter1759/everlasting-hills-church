"use client";

import { useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import type { ApiError } from "@/lib/api/axios";
import { submitPremaritalApplication } from "@/lib/api/premarital";
import { FORM_DEFAULTS, problemsOf, toPayload, type FieldProblems, type PremaritalFormValues } from "@/lib/pre-marital/schema";
import { ApplicantFields, PartnerFields } from "./form/PeopleFields";
import { DetailsFields } from "./form/DetailsFields";
import { PreMaritalSuccess } from "./PreMaritalSuccess";

/** A fresh key for this application; it is sent again on a retry so the API saves it once. */
function newKey(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * The application form: the only part of the page that runs in the browser.
 * Checked here and again on the server; each problem shows under its own
 * answer and nothing typed is lost. Saved before the thank-you appears, and a
 * double click or a retry sends the same key, so the team gets one application.
 */
export default function PremaritalForm({ privacyNotice, retention }: { privacyNotice: string; retention: string | null }) {
  const [submissionKey] = useState(newKey);
  const [done, setDone] = useState<{ names: string; referenceCode: string } | null>(null);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const { register, getValues, setError, clearErrors, watch, formState: { errors } } = useForm<PremaritalFormValues>({ defaultValues: FORM_DEFAULTS });
  const role = watch("applicantRole");

  function show(problems: FieldProblems) {
    Object.entries(problems).forEach(([field, message], i) => setError(field as keyof PremaritalFormValues, { message }, { shouldFocus: i === 0 }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    const values = getValues();
    clearErrors();
    setProblem("");
    const problems = problemsOf(values);
    if (Object.keys(problems).length) {
      show(problems);
      setProblem("Please check the answers marked below.");
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const saved = await submitPremaritalApplication(toPayload(values, submissionKey));
      setDone({ names: `${values.applicantFirstName.trim()} and ${values.partnerFirstName.trim()}`, referenceCode: saved.referenceCode });
    } catch (err) {
      const e = err as ApiError;
      const details = (Array.isArray(e.details) ? e.details : []) as { path?: string; message?: string }[];
      const fromServer = Object.fromEntries(details.filter((d) => d.path && d.path in FORM_DEFAULTS && d.message).map((d) => [d.path, d.message])) as FieldProblems;
      show(fromServer);
      setProblem(
        Object.keys(fromServer).length
          ? "Please check the answers marked below."
          : e.status === 429
            ? "Too many tries in a short time. Wait a minute, then send it again. Your answers are still here."
            : "Your application did not go through. Check your connection and send it again. Your answers are still here.",
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  if (done) return <PreMaritalSuccess names={done.names} referenceCode={done.referenceCode} />;

  return (
    <form noValidate onSubmit={onSubmit} aria-labelledby="apply-heading" className="space-y-8 rounded-2xl border border-gray-200 bg-white p-5 text-black sm:p-8">
      <p className="text-sm text-gray-600">
        Answers marked <span className="text-red-500">*</span> are needed.
      </p>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="pmc-website">Leave this empty</label>
        <input id="pmc-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>
      <ApplicantFields register={register} errors={errors} role={role} />
      <PartnerFields register={register} errors={errors} role={role} />
      <DetailsFields register={register} errors={errors} privacyNotice={privacyNotice} retention={retention} />
      {problem && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {problem}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-church-maroon px-6 text-base font-semibold text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-church-maroon disabled:cursor-not-allowed disabled:opacity-60 motion-safe:transition-opacity"
      >
        {busy ? "Sending your application…" : "Send my application"}
      </button>
    </form>
  );
}
