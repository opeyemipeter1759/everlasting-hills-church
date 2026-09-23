"use client";

import { X } from "lucide-react";
import type { MasterListRow } from "@/lib/api/follow-up-pipeline";
import { MasterStatusBadge } from "./MasterStatusBadge";
import { Avatar } from "./message-bits";

/**
 * The top of the drawer: a burgundy band carrying the person's photo, name and
 * where they stand, so the panel opens with the thing you clicked, plainly
 * stated, rather than a wall of grey fields.
 */
export function DrawerHeader({ person, onClose }: { person: MasterListRow; onClose: () => void }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#87102C] via-[#9B1435] to-[#6E0C24] px-6 pb-6 pt-5 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/10 blur-3xl"
      />

      <div className="relative flex items-start gap-4">
        <div className="rounded-2xl ring-2 ring-white/25">
          <Avatar name={person.name} photoUrl={person.photoUrl} size={52} />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="truncate text-xl font-bold leading-tight">{person.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <MasterStatusBadge status={person.status} />
            {!person.hasAccount && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white ring-1 ring-inset ring-white/20">
                No account yet
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
