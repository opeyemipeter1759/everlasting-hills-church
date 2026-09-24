"use client";

import { useState } from "react";
import Image from "next/image";

/** A column heading in the Master list table. */
export function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45 ${className}`}
    >
      {children}
    </th>
  );
}

export function PageButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
    >
      {children}
    </button>
  );
}

/**
 * Their photo, or their initials when there isn't one — every row has one or
 * the other. A photo that won't load (a host we don't allow, a deleted file)
 * falls back to the initials rather than leaving a broken image in the table.
 */
export function RowAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  if (photoUrl && !failed) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={36}
        height={36}
        onError={() => setFailed(true)}
        className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
      />
    );
  }

  return (
    <span
      title={name}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#87102C] to-[#6E0C24] text-xs font-bold text-white"
    >
      {initials}
    </span>
  );
}

/** WhatsApp link for a Nigerian number typed in any of the usual local forms. */
export function whatsappHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("0") ? `234${digits.slice(1)}` : digits}`;
}
