"use client";

import type { PersonRef } from "@/types/follow-up";
import { Avatar } from "./message-bits";

/**
 * The names offered while typing "@" — your own unit, so a message can call
 * on whoever should see it. Sits above the box, as chat apps do, so it never
 * covers what you are writing.
 */
export function MentionMenu({ people, onPick }: { people: PersonRef[]; onPick: (name: string) => void }) {
  return (
    <ul className="absolute bottom-full left-0 z-10 mb-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#26262a]">
      <li className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-white/35">
        People
      </li>
      {people.map((person, index) => (
        <li key={person.id}>
          <button
            type="button"
            onMouseDown={(e) => {
              // mousedown, not click: the box must not lose focus first.
              e.preventDefault();
              onPick(person.name);
            }}
            className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-[#FFF7F9] dark:hover:bg-white/[0.06] ${
              index === 0 ? "bg-gray-50 dark:bg-white/[0.04]" : ""
            }`}
          >
            <Avatar name={person.name} photoUrl={person.photoUrl} size={24} />
            <span className="truncate text-sm font-medium text-[#111] dark:text-white">{person.name}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
