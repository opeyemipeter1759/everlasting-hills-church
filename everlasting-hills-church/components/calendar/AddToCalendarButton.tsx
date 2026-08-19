"use client";

import { CalendarPlus } from "lucide-react";

type Kind = "service" | "event" | "gathering";

interface Props {
  kind: Kind;
  /** Service id, event id or slug, or gathering id. */
  id: string;
  label?: string;
  /** "solid" for a primary action, "subtle" alongside other controls. */
  variant?: "solid" | "subtle";
  className?: string;
}

/**
 * "Add to calendar" control. Downloads a single .ics from the API.
 *
 * A plain anchor rather than a fetch-and-blob: the browser's own download
 * handling is what makes the file open in the member's calendar app, and on iOS
 * a blob URL frequently opens a blank preview instead of handing off to
 * Calendar. The API sets Content-Disposition: attachment, so this works the
 * same on Android, iOS and desktop.
 */
export default function AddToCalendarButton({
  kind,
  id,
  label = "Add to calendar",
  variant = "subtle",
  className = "",
}: Props) {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  const href = `${apiBase}/calendar/${kind}/${encodeURIComponent(id)}.ics`;

  const styles =
    variant === "solid"
      ? "bg-[#87102C] text-white hover:bg-[#6E0C24]"
      : "border border-[#E7CDD3] text-[#5A4A4D] hover:bg-[#FFF4F6] dark:border-white/[0.14] dark:text-white/70 dark:hover:bg-white/[0.07]";

  return (
    <a
      href={href}
      // download hints the filename; the server's Content-Disposition is
      // authoritative and carries a readable slug.
      download
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${styles} ${className}`}
    >
      <CalendarPlus className="h-4 w-4" />
      {label}
    </a>
  );
}
