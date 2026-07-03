"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
}

export default function SubmitButton({
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg bg-[#87102C] text-white text-xs font-bold",
        "px-4 py-2 hover:bg-[#6E0C24] transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      ]
        .join(" ")
        .trim()}
      {...rest}
    >
      {loading && (
        <svg
          className="h-3.5 w-3.5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
