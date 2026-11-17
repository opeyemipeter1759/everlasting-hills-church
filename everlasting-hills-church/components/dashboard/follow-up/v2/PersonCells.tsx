import { MessageCircle } from "lucide-react";
import type { PipelineRow } from "@/lib/api/pipeline";
import { shortDate, stageLabel, waLink } from "./status";

/** Their photo when one is on file, otherwise their initials. */
export function PersonAvatar({ row, size = 36 }: { row: PipelineRow; size?: number }) {
  const initials = `${row.firstName[0] ?? ""}${row.lastName[0] ?? ""}`.toUpperCase();
  if (row.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URLs, not for the image optimiser
    return <img src={row.photoUrl} alt="" width={size} height={size} className="flex-shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] text-xs font-bold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]"
    >
      {initials}
    </span>
  );
}

/** Phone number with a one-tap WhatsApp chat. */
export function PhoneCell({ phone }: { phone: string | null }) {
  if (!phone) return <span className="text-gray-400 dark:text-white/30">No phone</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="tabular-nums">{phone}</span>
      <a
        href={waLink(phone)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Chat with ${phone} on WhatsApp`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
      >
        <MessageCircle size={15} aria-hidden="true" />
      </a>
    </span>
  );
}

/** How they heard about the church, with the inviter or the "Other" text when there is one. */
export function heardText(row: PipelineRow): string {
  if (!row.heardFrom) return "Not given";
  if (row.invitedBy && /friend|family/i.test(row.heardFrom)) return `${row.heardFrom} (${row.invitedBy})`;
  if (row.heardFromOther && /other/i.test(row.heardFrom)) return `Other: ${row.heardFromOther}`;
  return row.heardFrom;
}

/** Stage and assignee, the follow-up facts on one line. */
export function stageText(row: PipelineRow): string {
  return `${stageLabel(row.stage)}${row.assigneeName ? `, ${row.assigneeName}` : ", nobody assigned"}`;
}

export function visitsText(row: PipelineRow): string {
  return row.visitDates.length ? row.visitDates.map(shortDate).join(", ") : shortDate(row.firstVisitDate);
}
