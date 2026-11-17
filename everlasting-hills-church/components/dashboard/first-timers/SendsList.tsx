import { Mail, MessageCircle } from "lucide-react";
import type { OpeningSend } from "@/lib/api/opening-message";

const STATUS_TEXT: Record<OpeningSend["status"], string> = {
  SENT: "Sent",
  PENDING: "Sending",
  FAILED: "Did not go through",
  SKIPPED: "Not sent: today's email allowance had run out",
};

/** "17 Nov, 09:40" in church time. */
export function churchTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });
}

function who(send: OpeningSend): string {
  if (send.automatic) return "Welcome email, sent automatically";
  return `${send.channel === "whatsapp" ? "WhatsApp" : "Email"} from ${send.sentByName ?? "a team member"}`;
}

/** Every opening message sent to one first-timer, newest first. */
export function SendsList({ sends }: { sends: OpeningSend[] }) {
  if (sends.length === 0) return <p className="text-sm text-gray-500 dark:text-white/50">Nothing sent yet.</p>;
  return (
    <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
      {sends.map((s) => {
        const Icon = s.channel === "whatsapp" ? MessageCircle : Mail;
        const ok = s.status === "SENT";
        return (
          <li key={s.id} className="flex items-start gap-3 py-2.5">
            <Icon size={16} aria-hidden="true" className={`mt-0.5 flex-shrink-0 ${s.channel === "whatsapp" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-white/50"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-800 dark:text-white/80">{who(s)}</p>
              <p className="text-xs text-gray-500 dark:text-white/45">
                {churchTime(s.sentAt)}, message version {s.templateVersion}
              </p>
            </div>
            <span className={`flex-shrink-0 text-xs font-semibold ${ok ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>{STATUS_TEXT[s.status] ?? s.status}</span>
          </li>
        );
      })}
    </ul>
  );
}
