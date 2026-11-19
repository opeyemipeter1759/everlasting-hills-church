"use client";

import { useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import type { ApiError } from "@/lib/api/axios";
import { submitPreMaritalApplication } from "@/lib/api/pre-marital";
import { FORM_DEFAULTS, problemsOf, toPayload, type PreMaritalFormValues } from "@/lib/pre-marital/schema";
import { CoupleFields } from "./CoupleFields";
import { PersonFields } from "./PersonFields";
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
 * The couple's application. Checked here and again on the server; a problem
 * shows under its own answer and everything typed stays. It is saved before
 * the thank-you appears, and a double click or a retry sends the same key, so
 * the pastors get one application, not two.
 */
export default function PreMaritalApplication() {
  const [submissionKey] = useState(newKey);
  const [done, setDone] = useState<{ names: string; referenceCode: string } | null>(null);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const {
    register,
    control,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<PreMaritalFormValues>({ defaultValues: FORM_DEFAULTS });

  function showProblems(problems: Partial<Record<keyof PreMaritalFormValues, string>>) {
    Object.entries(problems).forEach(([field, message], i) =>
      setError(field as keyof PreMaritalFormValues, { message }, { shouldFocus: i === 0 }),
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending.current) return; // a second click while the first is on its way
    const values = getValues();
    clearErrors();
    setProblem("");
    const problems = problemsOf(values);
    if (Object.keys(problems).length > 0) {
      showProblems(problems);
      setProblem("Please check the answers marked below.");
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      const saved = await submitPreMaritalApplication(toPayload(values, submissionKey));
      setDone({ names: `${values.groomFirstName.trim()} and ${values.brideFirstName.trim()}`, referenceCode: saved.referenceCode });
    } catch (err) {
      const e = err as ApiError;
      const details = (Array.isArray(e.details) ? e.details : []) as { path?: string; message?: string }[];
      const fromServer = Object.fromEntries(
        details.filter((d) => d.path && d.path in FORM_DEFAULTS && d.message).map((d) => [d.path, d.message]),
      ) as Partial<Record<keyof PreMaritalFormValues, string>>;
      showProblems(fromServer);
      setProblem(
        Object.keys(fromServer).length > 0
          ? "Please check the answers marked below."
          : e.status === 429
            ? "Too many tries in a short time. Wait a minute, then send it again. Your answers are still here."
            : "Your application did not go through. Check your connection and send it again. Your answers are still here.",
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  if (done) return <PreMaritalSuccess names={done.names} referenceCode={done.referenceCode} />;

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-8 rounded-xl border border-gray-200 bg-white p-5 text-black sm:p-8">
      <p className="text-sm text-gray-600">
        Answers marked <span className="text-red-500">*</span> are needed.
      </p>
      <PersonFields who="groom" register={register} errors={errors} />
      <PersonFields who="bride" register={register} errors={errors} />
      <CoupleFields register={register} control={control} errors={errors} />

      {problem && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {problem}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-xl bg-church-maroon px-6 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Sending your application…" : "Send our application"}
      </button>
    </form>
  );
}
