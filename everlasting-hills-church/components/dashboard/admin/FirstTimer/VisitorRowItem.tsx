"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { VisitorRow } from "./types";
import { relativeDate } from "./helpers";
import Avatar from "./Avatar";
import { TypeBadge, InterestBadge } from "./badges";
import CreateAccountBtn from "./CreateAccountBtn";
import VisitorDetails from "./VisitorDetails";

export default function VisitorRowItem({
  visitor,
  onCreated,
}: {
  visitor: VisitorRow;
  onCreated: (visitorId: string) => void;
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
          <CreateAccountBtn visitor={visitor} onCreated={onCreated} />
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
