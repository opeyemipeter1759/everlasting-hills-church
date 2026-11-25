"use client";

import { Crown, Eye, Loader2, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import {
  NAV_GRANT_TYPE_LABELS,
  useSetNavGrantAccess,
  type NavGrantAccess,
  type NavGrantType,
  type NavPermissionGrantEntry,
} from "@/lib/nav-permissions";

const TYPE_ICON: Record<NavGrantType, React.ElementType> = {
  MEMBER: UserPlus,
  UNIT_MEMBER: Users,
  UNIT_LEAD: Crown,
};

export const ACCESS_OPTIONS: { value: NavGrantAccess; label: string; hint: string }[] = [
  { value: "VIEW", label: "View only", hint: "Can open the page and see everything, but not add, edit or delete" },
  { value: "FULL", label: "Full access", hint: "Can do everything on the page" },
];

/** One named exception: who, which page, view only or full access, and remove. */
export function NavGrantRow({
  grant,
  pageLabel,
  removing,
  disabled,
  onRemove,
}: {
  grant: NavPermissionGrantEntry;
  pageLabel: string;
  removing: boolean;
  disabled: boolean;
  onRemove: () => void;
}) {
  const setAccess = useSetNavGrantAccess();
  const Icon = TYPE_ICON[grant.type];
  const access = grant.access ?? "FULL";

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 dark:border-white/10">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/15">
        <Icon size={13} className="text-[#87102C] dark:text-[#e8768a]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-gray-800 dark:text-white/80">
          {grant.name ?? <span className="italic text-gray-400">Deleted</span>}
        </p>
        <p className="truncate text-[11px] text-gray-400">
          {NAV_GRANT_TYPE_LABELS[grant.type]} · {pageLabel}
        </p>
      </div>

      <div role="radiogroup" aria-label={`Access for ${grant.name ?? "this grant"}`} className="flex shrink-0 rounded-lg bg-gray-100 p-0.5 dark:bg-white/5">
        {ACCESS_OPTIONS.map((option) => {
          const active = access === option.value;
          const OptionIcon = option.value === "VIEW" ? Eye : Pencil;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={option.hint}
              disabled={setAccess.isPending || active}
              onClick={() => setAccess.mutate({ id: grant.id, access: option.value })}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                active
                  ? "bg-white text-[#87102C] shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-gray-500 hover:text-gray-800 dark:text-white/50 dark:hover:text-white"
              }`}
            >
              <OptionIcon size={11} aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/10"
        aria-label={`Remove exception for ${grant.name ?? "this target"}`}
      >
        {removing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
    </li>
  );
}
