import type { UseFormRegisterReturn } from "react-hook-form";

/** A set of radio cards with a visible label, its problem read out, and full keyboard use (arrow keys within, Tab between). */
export function ChoiceGroup({
  id,
  label,
  options,
  error,
  registration,
  columns = 1,
}: {
  id: string;
  label: string;
  options: readonly { value: string; label: string }[];
  error?: string;
  registration: UseFormRegisterReturn;
  columns?: 1 | 3;
}) {
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-1.5 text-sm font-semibold text-gray-900">
        {label}
        <span className="text-red-500" aria-hidden="true"> *</span>
      </legend>
      <div className={`grid gap-2 ${columns === 3 ? "sm:grid-cols-3" : ""}`}>
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-sm font-medium text-gray-900 has-[:checked]:border-church-maroon has-[:checked]:bg-[#FFF4F6] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-church-maroon/40 ${error ? "border-red-300" : "border-gray-200"}`}
          >
            <input type="radio" value={o.value} className="h-4 w-4 flex-shrink-0 accent-church-maroon" {...registration} />
            {o.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** A tick box with its problem. */
export function Tick({ id, error, registration, children }: { id: string; error?: string; registration: UseFormRegisterReturn; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-800">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 h-5 w-5 flex-shrink-0 accent-church-maroon"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...registration}
        />
        <span>
          {children}
          <span className="text-red-500" aria-hidden="true"> *</span>
        </span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
