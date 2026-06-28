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

const labelBase =
  "block text-xs font-semibold text-[#5A4A4D] dark:text-white/60 mb-2 tracking-wide";

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  maxLengthHint?: number;
  value?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea({ label, icon: Icon, error, hint, maxLengthHint, value, id, className, ...rest }, ref) {
    const inputId = id ?? `t-${label.replace(/\s+/g, "-").toLowerCase()}`;
    const used = typeof value === "string" ? value.length : 0;
    return (
      <div>
        <label htmlFor={inputId} className={labelBase}>
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon
              size={16}
              className="absolute left-4 top-4 text-[#87102C]/55 dark:text-[#FFB3C1]/50 pointer-events-none"
            />
          )}
          <textarea
            id={inputId}
            ref={ref}
            value={value}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-err` : undefined}
            className={`${inputBase} resize-y min-h-[120px] leading-relaxed ${Icon ? "pl-11" : ""} ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/50 dark:focus:border-red-500/70"
                : ""
            } ${className ?? ""}`}
            {...rest}
          />
        </div>
        <div className="flex items-start justify-between gap-3 mt-1.5">
          {error ? (
            <p id={`${inputId}-err`} className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : hint ? (
            <p className="text-xs text-[#8a7e80] dark:text-white/35">{hint}</p>
          ) : (
            <span />
          )}
          {typeof maxLengthHint === "number" && (
            <p
              className={`text-xs tabular-nums ${
                used > maxLengthHint
                  ? "text-red-600 dark:text-red-400"
                  : "text-[#8a7e80] dark:text-white/35"
              }`}
            >
              {used}/{maxLengthHint}
            </p>
          )}
        </div>
      </div>
    );
  },
);
