"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { useFollowUpPerson, type MasterListRow } from "@/lib/api/follow-up-pipeline";
import type { PipelineRow } from "@/lib/api/pipeline";

/**
 * A pipeline row as the team conversation drawer reads it. The conversation
 * lives on the account once one was made from the form, else on the form.
 */
export function drawerPerson(row: PipelineRow): MasterListRow {
  return {
    id: row.memberId ?? row.visitorId,
    kind: row.memberId ? "MEMBER" : "VISITOR",
    name: `${row.firstName} ${row.lastName}`,
    photoUrl: row.photoUrl ?? null,
    assignedTo: row.assigneeId ? { id: row.assigneeId, name: row.assigneeName ?? "Someone" } : null,
    status: row.status,
    hasAccount: !!row.memberId,
    attended: row.visits,
  };
}

/** Opens the team's conversation about one person, from a list row. */
export function NotesButton({ row, onOpen }: { row: PipelineRow; onOpen: (person: MasterListRow) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(drawerPerson(row))}
      aria-label={`Team notes on ${row.firstName}`}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#87102C] hover:bg-[#FFE8ED] dark:text-[#FFB3C1] dark:hover:bg-white/10"
    >
      <MessagesSquare size={14} aria-hidden="true" />
      Notes
    </button>
  );
}

/** "MEMBER:abc" or "VISITOR:abc" from an alert's link, else null. */
function parseThread(value: string | null): { kind: "MEMBER" | "VISITOR"; id: string } | null {
  const match = value?.match(/^(MEMBER|VISITOR):(.+)$/);
  return match ? { kind: match[1] as "MEMBER" | "VISITOR", id: match[2] } : null;
}

/**
 * New-activity emails and bell alerts link here with `?thread=KIND:id`: open
 * that person's drawer, their conversation, straight away, then take the
 * parameter off the address so closing it doesn't open it again. Only the main
 * list does this (`enabled`), so a board never opens two drawers.
 */
export function useOpenLinkedThread(enabled: boolean, open: (row: MasterListRow) => void) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const linked = enabled ? parseThread(params?.get("thread") ?? null) : null;
  const { data: person } = useFollowUpPerson(linked);
  const done = useRef(false);

  useEffect(() => {
    if (!person || done.current) return;
    done.current = true;
    open({
      id: person.id,
      kind: person.kind,
      name: person.name,
      photoUrl: person.photoUrl,
      assignedTo: person.assignedTo,
      status: person.status,
      hasAccount: person.hasAccount,
      attended: person.attended,
    });
    // Keep any other filters (month and year live in the address too).
    const rest = new URLSearchParams(params?.toString() ?? "");
    rest.delete("thread");
    const path = pathname ?? "/";
    router.replace(rest.size ? `${path}?${rest}` : path, { scroll: false });
  }, [person, open, router, pathname, params]);
}
