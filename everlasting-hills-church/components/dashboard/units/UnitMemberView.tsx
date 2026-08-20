"use client";

import { useState } from "react";
import { useMe, useMyMembershipDetail, useUnitTasks, useUpdateUnitTask } from "@/lib/api";
import type { UnitMemberEntry, UnitTaskStatus } from "@/types";
import UnitHero from "./UnitHero";
import UnitTaskList from "./UnitTaskList";
import UnitRolesCard from "./UnitRolesCard";
import UnitRoster from "./UnitRoster";
import MessageMemberModal from "./MessageMemberModal";
import { nextStatus } from "./taskStatus";

type MessageTarget = { id: string; name: string; photoUrl: string | null };

function groupByRole(members: UnitMemberEntry[]): Record<string, UnitMemberEntry[]> {
  return members
    .filter((m) => m.position)
    .reduce<Record<string, UnitMemberEntry[]>>((acc, m) => {
      const key = m.position!.name;
      acc[key] = [...(acc[key] ?? []), m];
      return acc;
    }, {});
}

export default function UnitMemberView({ unitId }: { unitId: string }) {
  const { data: me } = useMe();
  const { data: unit, isLoading, refetch: refetchUnit, isFetching: unitFetching } = useMyMembershipDetail(unitId);
  const { data: tasks, refetch: refetchTasks, isFetching: tasksFetching } = useUnitTasks(unitId);
  const updateTask = useUpdateUnitTask();

  const [messageTarget, setMessageTarget] = useState<MessageTarget | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const myMemberId = me?.member?.id ?? null;

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
        <div className="h-40 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        <div className="h-48 bg-gray-100 dark:bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!unit) return null;

  const myTasks = (tasks ?? []).filter((t) => t.assignedToId === myMemberId);
  const unitTasks = (tasks ?? []).filter((t) => t.assignedToId !== myMemberId);
  const roles = groupByRole(unit.UnitMember);
  const leaders = unit.UnitMember.filter((m) => m.isLead || m.isAssistant);
  const leaderName = leaders.find((l) => l.isLead)?.Member.firstName ?? leaders[0]?.Member.firstName ?? null;
  const otherMembers: MessageTarget[] = unit.UnitMember.filter((m) => m.memberId !== myMemberId).map((m) => ({
    id: m.memberId,
    name: `${m.Member.firstName} ${m.Member.lastName}`,
    photoUrl: m.Member.photoUrl,
  }));

  function cycleStatus(taskId: string, current: UnitTaskStatus) {
    updateTask.mutate({ unitId, taskId, status: nextStatus(current) });
  }

  function refresh() {
    refetchUnit();
    refetchTasks();
  }

  return (
    <div className="space-y-5 mx-auto max-w-6xl">
      <UnitHero
        unit={unit}
        myTasksTotal={myTasks.length}
        myTasksDone={myTasks.filter((t) => t.status === "DONE").length}
        leaderName={leaderName}
        canMessage={otherMembers.length > 0}
        onMessageSomeone={() => setShowPicker(true)}
        onRefresh={refresh}
        isRefreshing={unitFetching || tasksFetching}
      />

      <UnitTaskList unitId={unitId} title="My tasks" tasks={myTasks} delay={0.05} onCycleStatus={cycleStatus} />
      <UnitTaskList unitId={unitId} title="Unit tasks" tasks={unitTasks} delay={0.1} />
      <UnitRolesCard roles={roles} delay={0.15} />
      <UnitRoster unit={unit} myMemberId={myMemberId} onMessage={setMessageTarget} delay={0.2} />

      {messageTarget && (
        <MessageMemberModal unitId={unitId} recipient={messageTarget} onClose={() => setMessageTarget(null)} />
      )}
      {showPicker && (
        <MessageMemberModal unitId={unitId} recipients={otherMembers} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
