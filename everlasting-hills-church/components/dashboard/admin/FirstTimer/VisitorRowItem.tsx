"use client";

import { useState } from "react";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { VisitorRow } from "./types";
import { relativeDate } from "./helpers";
import Avatar from "./Avatar";
import { TypeBadge, InterestBadge } from "./badges";
import CreateAccountBtn from "./CreateAccountBtn";
import VisitorDetails from "./VisitorDetails";

export default function VisitorRowItem({
  visitor,
  onCreated,
  onEdit,
  onDelete,
}: {
  visitor: VisitorRow;
  onCreated: (visitorId: string) => void;
  onEdit: (visitor: VisitorRow) => void;
  onDelete: (visitor: VisitorRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = `${visitor.firstName} ${visitor.lastName}`;

  return (
    <>
      <tr
        className="border-b border-[#E7CDD3]/40 dark:border-white/[0.07] last:border-0 hover:bg-[#FFF4F6]/60 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Avatar name={name} />
            <div>
              <p className="font-semibold text-[#111] dark:text-white text-sm leading-tight">{name}</p>
              {visitor.email && (
                <p className="text-[#8a7e80] dark:text-white/40 text-xs leading-tight truncate max-w-[160px]">
                  {visitor.email}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5 hidden sm:table-cell">
          <TypeBadge type={visitor.attendanceType} />
        </td>
        <td className="px-5 py-3.5 hidden md:table-cell">
          <InterestBadge interest={visitor.membershipInterest} />
        </td>
        <td className="px-5 py-3.5 hidden lg:table-cell">
          <span className="text-xs text-[#8a7e80] dark:text-white/40">{relativeDate(visitor.submittedAt)}</span>
        </td>
        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <CreateAccountBtn visitor={visitor} onCreated={onCreated} />
            <button
              type="button"
              onClick={() => onEdit(visitor)}
              aria-label={`Edit ${name}`}
              title="Edit"
              className="w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-[#8a7e80] dark:text-white/40 hover:text-[#87102C] dark:hover:text-[#FFB3C1] hover:bg-[#FFF4F6] dark:hover:bg-white/10 transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(visitor)}
              aria-label={`Delete ${name}`}
              title="Delete"
              className="w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-[#8a7e80] dark:text-white/40 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </td>
        <td className="px-3 py-3.5">
          <div className={`text-[#b8a8ac] dark:text-white/25 transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
            <ChevronRight size={14} />
          </div>
        </td>
      </tr>
      {open && <VisitorDetails visitor={visitor} />}
    </>
  );
}
