import type { CaseDocuments } from "@/lib/api/marriage-documents";
import { lagosDate } from "../ui";

const KIND = { MEMBER: "member account", COUPLE: "own sign-in" } as const;

/** Each partner's dashboard sign-in, as one quiet line for the office. */
export function SignInsLine({ accounts }: { accounts: CaseDocuments["accounts"] }) {
  if (!accounts.length) return null;
  const parts = accounts.map((a) => {
    const who = `${a.firstName}${a.role ? ` (${a.role === "GROOM" ? "groom" : "bride"})` : ""}`;
    if (!a.kind) return `${who}: no sign-in yet`;
    return `${who}: ${KIND[a.kind]}${a.signInSentAt ? `, details sent ${lagosDate(a.signInSentAt)}` : ", details not sent yet"}`;
  });
  return <p className="mt-2 text-xs text-gray-600 dark:text-white/55">Dashboard sign-ins. {parts.join(". ")}.</p>;
}
