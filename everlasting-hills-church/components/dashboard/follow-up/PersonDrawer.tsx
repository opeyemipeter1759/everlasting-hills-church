"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useFollowUpPerson, type MasterListRow } from "@/lib/api/follow-up-pipeline";
import { DrawerHeader } from "./DrawerHeader";
import { DrawerFacts } from "./DrawerFacts";
import { ActivityThread } from "./ActivityThread";
import { StatusPicker } from "./StatusPicker";
import { AssigneeCard } from "./AssigneeCard";
import { useFollowUpLeadership } from "./useFollowUpLeadership";

/**
 * One person, opened from the Master list: who they are, how to reach them,
 * and everything the church knows about them. Slides in from the right so the
 * list stays where it was.
 */
export function PersonDrawer({ person, onClose }: { person: MasterListRow | null; onClose: () => void }) {
  const { data, isLoading } = useFollowUpPerson(person ? { kind: person.kind, id: person.id } : null);
  // Handing someone's follow-up to another person is the Follow Up unit
  // lead's call (or its head of department's), not any unit lead's.
  const { canRunUnit } = useFollowUpLeadership();

  useEffect(() => {
    if (!person) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [person, onClose]);

  if (!person || typeof document === "undefined") return null;
  // The row already knows the name and status, so the drawer opens with them
  // filled in and the rest arrives a moment later — no empty panel.
  const shown = data && data.id === person.id ? data : null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={person.name} className="fixed inset-0 z-50">
      <div onClick={onClose} aria-hidden="true" className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

      {/* 70vh wide: roomy enough for the conversation to read as one, and it
          scales with the screen rather than being pinned to a fixed size. */}
      <div className="fixed inset-y-0 right-0 flex w-full max-w-full flex-col bg-[#FAFAFB] shadow-2xl sm:min-w-[70vh] sm:w-[70vh] dark:bg-[#141416]">
        <DrawerHeader person={person} onClose={onClose} />

        <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar px-5 py-5">
          {/* What people came to change, in one card. */}
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:divide-white/[0.06] dark:border-white/10 dark:bg-white/[0.04]">
            <div className="pb-3">
              <StatusPicker
                person={person}
                status={shown?.status ?? person.status}
                awaiting={shown?.statusAwaitingApproval ?? null}
              />
            </div>
            <div className="pt-3">
              <AssigneeCard
                assignedTo={shown?.assignedTo ?? person.assignedTo}
                entryId={shown?.entryId ?? null}
                canReassign={canRunUnit}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white px-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <DrawerFacts person={shown} isLoading={isLoading && !shown} />
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white px-4 pb-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
            <ActivityThread person={person} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
