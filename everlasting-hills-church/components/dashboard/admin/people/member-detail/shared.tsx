import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "../peopleShared";
import type { CarePerson } from "./types";

export function BackLink() {
  return (
    <Link
      href="/dashboard/admin/members"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#87102C] dark:text-[#e8768a] hover:gap-2.5 transition-all"
    >
      <ArrowLeft size={15} /> All people
    </Link>
  );
}

export function Section({
  title,
  icon,
  children,
  wide,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-5 sm:p-6 ${wide ? "sm:col-span-2" : ""}`}
    >
      <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a] mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/25">
          {icon}
        </span>
        {title}
      </p>
      {children}
    </div>
  );
}

export function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[#E7CDD3]/30 dark:border-white/[0.05] last:border-0">
      <span className="text-gray-300 dark:text-white/30 mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">{label}</p>
        <p className="text-sm text-gray-900 dark:text-white break-words">{value}</p>
      </div>
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-gray-500 dark:text-white/50">{label}</span>
        <span className="font-semibold text-gray-700 dark:text-white/70 tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-[#87102C]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function CareChip({ person }: { person: CarePerson }) {
  return (
    <Link
      href={`/dashboard/members/${person.id}`}
      className="flex items-center gap-2.5 rounded-xl border border-[#E7CDD3]/50 dark:border-white/10 px-3 py-2 hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03] transition-colors"
    >
      <Avatar photoUrl={person.photoUrl} firstName={person.firstName} lastName={person.lastName} size={28} />
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {person.firstName} {person.lastName}
      </span>
    </Link>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-gray-400 dark:text-white/40">{children}</p>;
}
