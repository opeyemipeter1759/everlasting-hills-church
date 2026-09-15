import { UserRound } from "lucide-react";

/**
 * Tells the author that every recipient gets their own opener — "Hello Daphne,"
 * — so they don't type "Hello everyone" and end up with two greetings. The
 * server adds the line automatically, or swaps in the name wherever the author
 * writes {{firstName}} instead.
 */
export default function PersonalGreetingHint({
  className = "",
  /** Announcements always auto-greet and don't fill placeholders, so hide that tip there. */
  allowToken = true,
}: {
  className?: string;
  allowToken?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-[#FFF4F6] dark:bg-white/[0.03] px-3 py-2 text-xs text-gray-600 dark:text-white/60 ${className}`}
    >
      <UserRound size={14} className="mt-0.5 shrink-0 text-[#87102C]" />
      <p className="leading-relaxed">
        Each person&apos;s email opens with their own name — e.g.{" "}
        <span className="font-semibold text-gray-900 dark:text-white">Hello Daphne,</span> — so there&apos;s no need to
        write a greeting.
        {allowToken && (
          <>
            {" "}
            To place the name yourself, type{" "}
            <code className="rounded bg-white dark:bg-white/10 px-1 py-0.5 font-mono text-[11px] text-[#87102C]">
              {"{{firstName}}"}
            </code>{" "}
            anywhere in the message.
          </>
        )}
      </p>
    </div>
  );
}
