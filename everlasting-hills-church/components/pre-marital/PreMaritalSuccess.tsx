"use client";

import { useEffect, useRef } from "react";

/**
 * Shown once the application is saved. Applying is not an appointment, and this says so.
 * It replaces a much longer form, so the page shrinks under the reader: bring it
 * into view (clear of the fixed header) and focus it, or they land further down the page.
 */
export function PreMaritalSuccess({ names, referenceCode }: { names: string; referenceCode: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    box.current?.scrollIntoView?.({ behavior: reduced ? "auto" : "smooth", block: "start" });
    box.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      ref={box}
      tabIndex={-1}
      role="status"
      className="scroll-mt-28 rounded-xl border border-gray-200 bg-white p-6 text-center text-black outline-none sm:p-8"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-church-maroon/10">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#87102C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">Thank you, {names}</h2>
      <p className="mx-auto mt-2 max-w-md leading-relaxed text-gray-700">
        We have your application. The pastoral team will review it and contact you both about next steps.
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
        This does not book a session yet. We will reach out to arrange one with you.
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-600">
        We are emailing you both how to sign in to your own counselling dashboard, where you can follow your application, see your
        sessions and upload your documents.
      </p>
      <p className="mt-5 text-sm text-gray-600">
        Your reference: <span className="font-mono text-base font-bold text-gray-900">{referenceCode}</span>
      </p>
      <p className="mt-1 text-xs text-gray-500">Keep it handy in case you need to ask about your application.</p>
    </div>
  );
}
