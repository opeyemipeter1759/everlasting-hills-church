"use client";

import { useState } from "react";
import { Crown, Shield, UserMinus, UserPlus, Users } from "lucide-react";
import { useMyUnit } from "./useMyUnit";
import AddMemberForm from "@/components/dashboard/admin/unit/AddMemberForm";

export default function UnitLeadDashboard() {
  const { summary, unit, addMember, removeMember } = useMyUnit();
  const [showAdd, setShowAdd] = useState(false);

  // loading
  if (summary === undefined) {
    return (
      <div className="space-y-4 max-w-2xl animate-pulse">
        <div className="h-6 w-40 bg-gray-200 dark:bg-white/10 rounded" />
        <div className="h-4 w-64 bg-gray-100 dark:bg-white/5 rounded" />
        <div className="h-48 bg-gray-100 dark:bg-white/5 rounded-xl" />
      </div>
    );
  }

  // no unit assigned
  if (!summary) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">My Unit</h1>
        <div className="mt-6 bg-white dark:bg-[#1c1c1e] border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
          <Users size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            You are not assigned as lead of any unit
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Contact an admin to be assigned to a unit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{summary.name}</h1>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              summary.isLead
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
            }`}
          >
            {summary.isLead ? <Crown size={9} /> : <Shield size={9} />}
            {summary.isLead ? "Lead" : "Assistant"}
          </span>
        </div>
        {summary.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{summary.description}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {summary.totalMembers} member{summary.totalMembers !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Member panel */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            Members {unit ? `(${unit.UnitMember.length})` : ""}
          </p>
          {!showAdd && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] hover:text-[#6E0C24] transition-colors"
            >
              <UserPlus size={13} />
              Add member
            </button>
          )}
        </div>

        <div className="p-5">
          {showAdd && unit && (
            <AddMemberForm
              existingMemberIds={unit.UnitMember.map((m) => m.memberId)}
              canPromoteLead={false}
              onCancel={() => setShowAdd(false)}
              onAdded={async (memberId, isLead) => {
                await addMember(unit.id, memberId, isLead);
                setShowAdd(false);
              }}
            />
          )}

          {/* Loading members */}
          {!unit && summary && (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-white/5 rounded-lg" />
              ))}
            </div>
          )}

          {unit && unit.UnitMember.length === 0 && !showAdd && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
              No members in this unit yet. Add your first member above.
            </p>
          )}

          {unit && unit.UnitMember.length > 0 && (
            <ul className="space-y-2">
              {unit.UnitMember.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02]"
                >
                  <span className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center">
                    {m.Member.photoUrl ? (
                      <img
                        src={m.Member.photoUrl}
                        alt={`${m.Member.firstName} ${m.Member.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#87102C] dark:text-[#e8768a]">
                        {m.Member.firstName[0]?.toUpperCase()}
                        {m.Member.lastName[0]?.toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {m.Member.firstName} {m.Member.lastName}
                      {m.isLead && (
                        <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <Crown size={9} />
                          Lead
                        </span>
                      )}
                    </p>
                    {m.Member.email && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {m.Member.email}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(unit.id, m.memberId)}
                    title="Remove from unit"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <UserMinus size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
