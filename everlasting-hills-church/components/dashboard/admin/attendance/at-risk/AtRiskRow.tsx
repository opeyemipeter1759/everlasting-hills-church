import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { REASONS, shortDate, weeksAgo, type RiskRow } from "./at-risk-data";

/** One dot per Sunday they could have come to: filled for each they came to, hollow for the rest. */
function SundayDots({ attended, eligible }: { attended: number | null; eligible: number }) {
  const came = attended ?? 0;
  return (
    <div className="flex items-center gap-2">
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: eligible }, (_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${i < came ? "bg-[#87102C] dark:bg-[#E8768A]" : "border border-gray-300 dark:border-white/25"}`} />
        ))}
      </span>
      <span className="whitespace-nowrap text-xs tabular-nums text-gray-600 dark:text-white/65">
        {came} of {eligible}
      </span>
    </div>
  );
}

export default function AtRiskRow({ row }: { row: RiskRow }) {
  const reason = REASONS[row.reason];
  return (
    <tr className="transition-colors hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
      <td className="w-full max-w-0 py-3 pl-5 pr-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {row.photoUrl ? (
            <Image src={row.photoUrl} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-black uppercase text-gray-500 dark:bg-white/10 dark:text-white/60">
              {row.userName.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <Link href={`/dashboard/admin/members/${row.userId}`} className="block truncate text-sm font-semibold text-gray-900 hover:underline dark:text-white">
              {row.userName}
            </Link>
            <p className="truncate text-xs text-gray-500 dark:text-white/50">{row.detail}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-3 py-3 sm:table-cell">
        <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${reason.badge}`}>{reason.label}</span>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 md:table-cell">
        {row.lastSeen ? (
          <>
            <p className="text-sm text-gray-800 dark:text-white/85">{shortDate(row.lastSeen)}</p>
            <p className="text-xs text-gray-500 dark:text-white/50">{weeksAgo(row.lastSeen)}</p>
          </>
        ) : (
          <p className="text-sm text-gray-500 dark:text-white/50">Never</p>
        )}
      </td>
      <td className="hidden px-3 py-3 lg:table-cell">
        <SundayDots attended={row.attended} eligible={row.eligible} />
      </td>
      <td className="py-3 pl-3 pr-5 text-right">
        {row.phone ? (
          <a
            href={`tel:${row.phone}`}
            aria-label={`Call ${row.userName}`}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-white/75 dark:hover:bg-white/5"
          >
            <Phone size={12} /> <span className="hidden sm:inline">Call</span>
          </a>
        ) : (
          <span className="whitespace-nowrap text-xs text-gray-400 dark:text-white/35">No phone</span>
        )}
      </td>
    </tr>
  );
}
