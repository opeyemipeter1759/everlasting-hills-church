'use client';

import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface AuthSubmitButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function AuthSubmitButton({ loading, loadingText, disabled, children, ...props }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      aria-busy={loading}
      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#87102C] to-[#a52242] text-white text-sm font-bold tracking-wide hover:from-[#6E0C24] hover:to-[#87102C] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#87102C]/20 hover:shadow-xl hover:shadow-[#87102C]/30 hover:-translate-y-0.5 disabled:hover:translate-y-0 inline-flex items-center justify-center gap-2"
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          {loadingText ?? children}
        </>
      ) : children}
    </button>
  );
}
