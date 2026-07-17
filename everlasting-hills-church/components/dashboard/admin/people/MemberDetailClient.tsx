"use client";

import { Activity, CalendarDays, CheckCircle2, Heart, Network, Users } from "lucide-react";
import { useMemberDetail } from "./member-detail/useMemberDetail";
import { completion } from "./member-detail/types";
import { BackLink, Section } from "./member-detail/shared";
import MemberDetailSkeleton from "./member-detail/MemberDetailSkeleton";
import MemberDetailError from "./member-detail/MemberDetailError";
import MemberHero from "./member-detail/MemberHero";
import ContactSection from "./member-detail/ContactSection";
import EngagementSection from "./member-detail/EngagementSection";
import ServiceTeamsSection from "./member-detail/ServiceTeamsSection";
import CareSection from "./member-detail/CareSection";
import AttendanceSection from "./member-detail/AttendanceSection";
import FollowUpSection from "./member-detail/FollowUpSection";
import PastorNotesSection from "./member-detail/PastorNotesSection";

export default function MemberDetailClient({ id }: { id: string }) {
  const { data: m, isLoading, error } = useMemberDetail(id);

  if (isLoading) return <MemberDetailSkeleton />;
  if (error || !m) return <MemberDetailError message={(error as { message?: string } | null)?.message} />;

  return (
    <div className="max-w-5xl space-y-6">
      <BackLink />

      <MemberHero member={m} completionPct={completion(m)} />

      <div className="grid sm:grid-cols-2 gap-6">
        <Section title="Contact & personal" icon={<Users size={15} />}>
          <ContactSection member={m} />
        </Section>

        <Section title="Engagement" icon={<Activity size={15} />}>
          <EngagementSection score={m.EngagementScore} />
        </Section>

        <Section title="EHC Service Teams" icon={<Network size={15} />}>
          <ServiceTeamsSection units={m.UnitMember} />
        </Section>

        <Section title="Care & discipleship" icon={<Heart size={15} />}>
          <CareSection asMember={m.CareAsMember} asLeader={m.CareAsLeader} />
        </Section>
      </div>

      <Section title="Recent attendance" icon={<CalendarDays size={15} />} wide>
        <AttendanceSection records={m.AttendanceRecord} />
      </Section>

      {m.FollowUpTask.length > 0 && (
        <Section title="Follow-up tasks" icon={<CheckCircle2 size={15} />} wide>
          <FollowUpSection tasks={m.FollowUpTask} />
        </Section>
      )}

      {m.PastorNote.length > 0 && (
        <Section title="Pastor notes" icon={<Heart size={15} />} wide>
          <PastorNotesSection notes={m.PastorNote} />
        </Section>
      )}
    </div>
  );
}
