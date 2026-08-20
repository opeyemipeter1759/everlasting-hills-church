"use client";

import { Crown, Mail, MessageCircle, Shield, Users2 } from "lucide-react";
import type { UnitDetail, UnitMemberEntry } from "@/types";
import SectionCard from "./SectionCard";

export default function UnitRoster({
  unit,
  myMemberId,
  onMessage,
  delay,
}: {
  unit: UnitDetail;
  myMemberId: string | null;
  onMessage: (member: { id: string; name: string; photoUrl: string | null }) => void;
  delay?: number;
}) {
  return (
    <SectionCard icon={Users2} title="Members" count={unit.UnitMember.length} delay={delay}>
      <ul className="space-y-2">
        {unit.UnitMember.map((m) => (
          <RosterRow key={m.id} m={m} isMe={m.memberId === myMemberId} onMessage={onMessage} />
        ))}
      </ul>
    </SectionCard>
  );
}

function RosterRow({
  m,
  isMe,
  onMessage,
}: {
  m: UnitMemberEntry;
  isMe: boolean;
  onMessage: (member: { id: string; name: string; photoUrl: string | null }) => void;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors">
      <span className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center ring-2 ring-white dark:ring-[#1c1c1e]">
        {m.Member.photoUrl ? (
          <img src={m.Member.photoUrl} alt={`${m.Member.firstName} ${m.Member.lastName}`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-[#87102C] dark:text-[#e8768a]">
            {m.Member.firstName[0]?.toUpperCase()}
            {m.Member.lastName[0]?.toUpperCase()}
          </span>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex items-center flex-wrap gap-x-2">
          {m.Member.firstName} {m.Member.lastName}
          {isMe && <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">You</span>}
          {m.isLead && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
              <Crown size={9} />
              Lead
            </span>
          )}
          {m.isAssistant && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 inline-flex items-center gap-1">
              <Shield size={9} />
              Assistant
            </span>
          )}
          {m.position && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
              {m.position.name}
            </span>
          )}
        </p>
        {m.Member.email && (m.isLead || m.isAssistant) && (
          <a
            href={`mailto:${m.Member.email}`}
            className="text-[11px] text-gray-500 dark:text-gray-400 truncate inline-flex items-center gap-1 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
          >
            <Mail size={10} /> {m.Member.email}
          </a>
        )}
      </div>
      {!isMe && (
        <button
          type="button"
          onClick={() => onMessage({ id: m.memberId, name: `${m.Member.firstName} ${m.Member.lastName}`, photoUrl: m.Member.photoUrl })}
          title={`Message ${m.Member.firstName}`}
          className="p-1.5 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 dark:hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <MessageCircle size={15} />
        </button>
      )}
    </li>
  );
}
