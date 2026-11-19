import type { ReactNode } from "react";

export const inputCls =
  "w-full rounded-xl border px-4 py-3 text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-church-maroon/20 sm:text-sm";

/** Border colour for an input, red when it has a problem. */
export const borderFor = (error?: string) => (error ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-church-maroon");

/** A labelled answer with its problem, if any, read out by screen readers. */
export function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-gray-900">
        {label}
        {required && <span className="text-red-500" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** The props that tie an input to its label and its problem. */
export const describedBy = (id: string, error?: string) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${id}-error` : undefined,
});
