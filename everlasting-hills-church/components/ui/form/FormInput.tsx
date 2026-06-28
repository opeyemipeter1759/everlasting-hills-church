"use client";

import { forwardRef } from "react";
import type { LucideIcon } from "lucide-react";

const inputBase =
  "w-full text-sm rounded-xl px-4 py-3 transition-all duration-200 " +
  "text-[#111] placeholder:text-[#a8a3a4] " +
  "bg-white border border-[#E7CDD3]/60 " +
  "focus:outline-none focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/15 " +
  "disabled:bg-[#FFF4F6] disabled:text-[#6E6364] disabled:cursor-not-allowed " +
  "dark:text-white dark:placeholder:text-white/30 " +
  "dark:bg-white/[0.06] dark:border-white/[0.10] " +
  "dark:focus:border-[#87102C]/65 dark:focus:ring-[#87102C]/15 " +
  "dark:disabled:bg-white/[0.03] dark:disabled:text-white/30 dark:disabled:border-white/[0.06]";

export const labelBase =
  "block text-xs font-semibold text-[#5A4A4D] dark:text-white/60 mb-2 tracking-wide";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ label, required, icon: Icon, error, hint, id, className, ...rest }, ref) {
    const inputId = id ?? `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <div>
        <label htmlFor={inputId} className={labelBase}>
          {label} {required && <span className="text-[#87102C]">*</span>}
        </label>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-err` : undefined}
            className={`${inputBase} ${Icon ? "pr-11" : ""} ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/50 dark:focus:border-red-500/70"
                : ""
            } ${className ?? ""}`}
            {...rest}
          />
          {Icon && (
            <Icon
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#87102C]/55 dark:text-[#FFB3C1]/50 pointer-events-none"
            />
          )}
        </div>
        {error ? (
          <p id={`${inputId}-err`} className="text-xs text-red-600 dark:text-red-400 mt-1.5">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-[#8a7e80] dark:text-white/35 mt-1.5">{hint}</p>
        ) : null}
      </div>
    );
  },
);
