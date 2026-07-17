import { useMemo, useState } from "react";
import { useAssignMembers, type PersonRow } from "@/lib/api/people";

export function useAssignMembersForm(preselected: PersonRow[], onClose: () => void) {
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(preselected.map((p) => [p.id, p.name])),
  );
  const [leader, setLeader] = useState<{ id: string; name: string } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const assign = useAssignMembers();
  const selectedIds = useMemo(() => Object.keys(selected), [selected]);

  function toggleMember(p: PersonRow) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = p.name;
      return next;
    });
  }

  function removeMember(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function close() {
    setSelected({});
    setLeader(null);
    setNote("");
    setError(null);
    setDone(null);
    onClose();
  }

  async function submit() {
    if (!leader || selectedIds.length === 0) return;
    setError(null);
    try {
      const res = await assign.mutateAsync({
        memberIds: selectedIds,
        leaderId: leader.id,
        note: note.trim() || undefined,
      });
      setDone(`Assigned ${res.assigned} to ${leader.name}${res.skipped ? ` · ${res.skipped} already assigned` : ""}.`);
      setTimeout(close, 1200);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Assignment failed");
    }
  }

  return {
    selected,
    selectedIds,
    toggleMember,
    removeMember,
    leader,
    setLeader,
    note,
    setNote,
    error,
    done,
    assign,
    close,
    submit,
  };
}
