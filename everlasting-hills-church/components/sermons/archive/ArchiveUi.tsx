'use client';

import type { ReactNode } from 'react';
import { ChevronDown, Info } from 'lucide-react';

export function Panel({ title, count, action, children }: { title: string; count?: number; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200/80 bg-[#F6F6F6] p-3 sm:p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <header className="mb-3 flex items-center justify-between gap-3 border-b border-gray-200 px-1 pb-3 dark:border-white/10">
        <h3 className="flex items-center gap-2 text-[15px] font-medium text-gray-900 dark:text-white">
          <Info size={16} className="text-gray-500 dark:text-gray-400" />
          {title}
          {typeof count === 'number' && (
            <span className="rounded bg-[#87102C]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#87102C] dark:bg-rose-300/10 dark:text-rose-300">
              {count}
            </span>
          )}
        </h3>
        {action}
      </header>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

export function PanelButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:border-[#87102C]/40 hover:text-[#87102C] dark:border-white/15 dark:bg-white/5 dark:text-gray-200"
    >
      {children}
    </button>
  );
}

export function PrimaryButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md bg-[#87102C] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[#6E0C24]"
    >
      {children}
    </button>
  );
}

export function Chevron({ open, onClick, label }: { open: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={label}
      className="flex-shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
    >
      <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}


export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 border-b border-gray-200 px-5 py-3 text-sm last:border-b-0 dark:border-white/10">
      <span className="w-20 flex-shrink-0 text-gray-700 dark:text-gray-200">{label}</span>
      <span className="min-w-0 text-gray-500 dark:text-gray-400">{value}</span>
    </div>
  );
}

