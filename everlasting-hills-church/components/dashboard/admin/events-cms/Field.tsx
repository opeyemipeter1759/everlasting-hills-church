import type { ReactNode } from "react";

export default function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
