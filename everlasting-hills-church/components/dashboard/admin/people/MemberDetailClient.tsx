"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Gift,
  Heart,
  Mail,
  MapPin,
  Network,
  Phone,
  Tag,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api/request";
import type { PersonRole } from "@/lib/api/people";
import {
  Avatar,
  displayId,
  fmtBirthday,
  fmtDate,
  genderLabel,
  ProfileCompletionMeter,
  ROLE_BADGE,
  ROLE_LABEL,
  STATUS_BADGE,
} from "./peopleShared";

interface CarePerson {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
}

interface MemberDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  weddingAnniversary: string | null;
  address: string | null;
  joinedAt: string;
  bio: string | null;
  photoUrl: string | null;
  status: string;
  tags: string[];
  Profile: { role: PersonRole } | null;
  EngagementScore: {
    score: number;
    attendanceScore: number;
    sermonScore: number;
    givingScore: number;
    communityScore: number;
  } | null;
  AttendanceRecord: {
    id: string;
    present: boolean;
    checkedInAt: string;
    Service: { id: string; name: string; scheduledAt: string };
  }[];
  PastorNote: { id: string; content: string; createdAt: string }[];
  FollowUpTask: {
    id: string;
    title: string;
    dueDate: string | null;
    done: boolean;
    createdAt: string;
  }[];
  UnitMember: { id: string; isLead: boolean; isAssistant: boolean; Unit: { id: string; name: string } }[];
  CareAsMember: { id: string; Leader: CarePerson }[];
  CareAsLeader: { id: string; Member: CarePerson }[];
}

function completion(m: MemberDetail): number {
  const checks = [
    Boolean(m.photoUrl),
    Boolean(m.email),
    Boolean(m.phone),
    Boolean(m.gender),
    Boolean(m.dateOfBirth),
    Boolean(m.address),
    m.UnitMember.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function MemberDetailClient({ id }: { id: string }) {
  const { data: m, isLoading, error } = useQuery({
    queryKey: ["member", id],
    queryFn: () => api.get<MemberDetail>(`/members/${id}`),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl space-y-5">
        <div className="h-6 w-24 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
        <div className="h-40 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="h-56 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          <div className="h-56 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !m) {
    return (
      <div className="max-w-5xl space-y-5">
        <BackLink />
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-400">
          {(error as { message?: string })?.message ?? "Member not found."}
        </div>
      </div>
    );
  }

  const role = m.Profile?.role ?? "MEMBER";
  const name = `${m.firstName} ${m.lastName}`.trim();

  return (
    <div className="max-w-5xl space-y-6">
      <BackLink />

      {/* Hero */}
      <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar photoUrl={m.photoUrl} firstName={m.firstName} lastName={m.lastName} size={72} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{name}</h1>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${ROLE_BADGE[role]}`}>
                {ROLE_LABEL[role]}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${STATUS_BADGE[m.status] ?? STATUS_BADGE.INACTIVE}`}>
                {m.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500 dark:text-white/50">
              <span className="font-mono text-xs font-semibold text-[#87102C] dark:text-[#e8768a]">{displayId(m.id)}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} /> Joined {fmtDate(m.joinedAt)}
              </span>
            </div>
          </div>
          <div className="sm:w-44">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1.5">
              Profile completion
            </p>
            <ProfileCompletionMeter value={completion(m)} />
          </div>
        </div>
        {m.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-5 pt-5 border-t border-[#E7CDD3]/40 dark:border-white/[0.06]">
            <Tag size={13} className="text-gray-300 dark:text-white/30" />
            {m.tags.map((t) => (
              <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#87102C]/10 text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a]">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Contact & personal */}
        <Section title="Contact & personal" icon={<Users size={15} />}>
          <InfoRow icon={<Mail size={14} />} label="Email" value={m.email ?? "—"} />
          <InfoRow icon={<Phone size={14} />} label="Phone" value={m.phone ?? "—"} />
          <InfoRow icon={<UserCheck size={14} />} label="Gender" value={genderLabel(m.gender)} />
          <InfoRow icon={<Gift size={14} />} label="Birthday" value={fmtBirthday(m.dateOfBirth)} />
          <InfoRow icon={<MapPin size={14} />} label="Address" value={m.address ?? "—"} />
        </Section>

        {/* Engagement */}
        <Section title="Engagement" icon={<Activity size={15} />}>
          {m.EngagementScore ? (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold text-[#87102C] dark:text-[#e8768a] tabular-nums">{m.EngagementScore.score}</span>
                <span className="text-xs text-gray-400 dark:text-white/40 mb-1.5">overall score</span>
              </div>
              <ScoreBar label="Attendance" value={m.EngagementScore.attendanceScore} />
              <ScoreBar label="Sermons" value={m.EngagementScore.sermonScore} />
              <ScoreBar label="Giving" value={m.EngagementScore.givingScore} />
              <ScoreBar label="Community" value={m.EngagementScore.communityScore} />
            </>
          ) : (
            <Empty>No engagement score computed yet.</Empty>
          )}
        </Section>

        {/* Service teams */}
        <Section title="EHC Service Teams" icon={<Network size={15} />}>
          {m.UnitMember.length === 0 ? (
            <Empty>Not on any service team yet.</Empty>
          ) : (
            <div className="flex flex-wrap gap-2">
              {m.UnitMember.map((u) => (
                <span key={u.id} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FFF4F6] text-[#9b3050] border border-[#E7CDD3] dark:bg-white/5 dark:text-[#e8a3b3] dark:border-white/10">
                  {u.Unit.name}
                  {u.isLead && <span className="text-[9px] uppercase font-bold text-[#87102C] dark:text-[#e8768a]">Lead</span>}
                  {u.isAssistant && <span className="text-[9px] uppercase font-bold text-gray-400">Asst</span>}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Care & discipleship */}
        <Section title="Care & discipleship" icon={<Heart size={15} />}>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2">Shepherded by</p>
          {m.CareAsMember.length === 0 ? (
            <Empty>Not assigned to a leader.</Empty>
          ) : (
            <div className="space-y-2 mb-4">
              {m.CareAsMember.map((c) => <CareChip key={c.id} person={c.Leader} />)}
            </div>
          )}
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2 mt-3">Shepherding</p>
          {m.CareAsLeader.length === 0 ? (
            <Empty>Not assigned anyone to shepherd.</Empty>
          ) : (
            <div className="space-y-2">
              {m.CareAsLeader.map((c) => <CareChip key={c.id} person={c.Member} />)}
            </div>
          )}
        </Section>
      </div>

      {/* Recent attendance */}
      <Section title="Recent attendance" icon={<CalendarDays size={15} />} wide>
        {m.AttendanceRecord.length === 0 ? (
          <Empty>No attendance records yet.</Empty>
        ) : (
          <ul className="divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06]">
            {m.AttendanceRecord.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.Service.name}</p>
                  <p className="text-xs text-gray-400 dark:text-white/40">{fmtDate(a.Service.scheduledAt)}</p>
                </div>
                {a.present ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={14} /> Present
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-white/40">
                    <XCircle size={14} /> Absent
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Follow-up tasks */}
      {m.FollowUpTask.length > 0 && (
        <Section title="Follow-up tasks" icon={<CheckCircle2 size={15} />} wide>
          <ul className="space-y-2">
            {m.FollowUpTask.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl border border-[#E7CDD3]/50 dark:border-white/10 px-4 py-2.5">
                <span className={`text-sm ${t.done ? "line-through text-gray-400 dark:text-white/40" : "text-gray-900 dark:text-white font-medium"}`}>
                  {t.title}
                </span>
                <span className="text-xs text-gray-400 dark:text-white/40">
                  {t.done ? "Done" : t.dueDate ? `Due ${fmtDate(t.dueDate)}` : "Open"}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Pastor notes */}
      {m.PastorNote.length > 0 && (
        <Section title="Pastor notes" icon={<Heart size={15} />} wide>
          <ul className="space-y-3">
            {m.PastorNote.map((n) => (
              <li key={n.id} className="rounded-xl bg-[#FFF4F6]/60 dark:bg-white/[0.03] border border-[#E7CDD3]/50 dark:border-white/10 p-4">
                <p className="text-sm text-gray-700 dark:text-white/80 whitespace-pre-wrap">{n.content}</p>
                <p className="text-[11px] text-gray-400 dark:text-white/40 mt-2">{fmtDate(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

// ── Bits ─────────────────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link href="/dashboard/members" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#87102C] dark:text-[#e8768a] hover:gap-2.5 transition-all">
      <ArrowLeft size={15} /> All people
    </Link>
  );
}

function Section({ title, icon, children, wide }: { title: string; icon: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-5 sm:p-6 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a] mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/25">{icon}</span>
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function ScoreBar({ label, value }: { label: string; value: number }) {
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

function CareChip({ person }: { person: CarePerson }) {
  return (
    <Link href={`/dashboard/members/${person.id}`} className="flex items-center gap-2.5 rounded-xl border border-[#E7CDD3]/50 dark:border-white/10 px-3 py-2 hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03] transition-colors">
      <Avatar photoUrl={person.photoUrl} firstName={person.firstName} lastName={person.lastName} size={28} />
      <span className="text-sm font-semibold text-gray-900 dark:text-white">
        {person.firstName} {person.lastName}
      </span>
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 dark:text-white/40">{children}</p>;
}
