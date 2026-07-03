"use client";

import { useState } from "react";
import { Crown, Trash2, UserMinus, UserPlus } from "lucide-react";
import { Role, Unit, UnitDetail } from "@/types";
import AddMemberForm from "./AddMemberForm";

interface DetailProps {
  unit: UnitDetail;
  role: Role;
  canDelete: boolean;
  canPromoteLead: boolean;
  onAddMember: (unitId: string, memberId: string, isLead: boolean) => Promise<void>;
  onRemoveMember: (unitId: string, memberId: string) => Promise<void>;
  onToggleLead: (unitId: string, memberId: string, isLead: boolean) => Promise<void>;
  onDeleteUnit: (u: Unit) => Promise<void>;
}

export default function UnitDetailPanel({
  unit,
  canDelete,
  canPromoteLead,
  onAddMember,
  onRemoveMember,
  onToggleLead,
  onDeleteUnit,
}: DetailProps) {
  const [showAdd, setShowAdd] = useState(false);
  const lead = unit.UnitMember.find((m) => m.isLead);

  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      <div className="p-5 border-b border-gray-100 dark:border-white/8 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">{unit.name}</h2>
          {unit.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unit.description}</p>
          )}
          {lead && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 inline-flex items-center gap-1.5 font-semibold">
              <Crown size={11} />
              Led by {lead.Member.firstName} {lead.Member.lastName}
            </p>
          )}
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDeleteUnit(unit)}
            title="Delete unit"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            Members ({unit.UnitMember.length})
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

        {showAdd && (
          <AddMemberForm
            existingMemberIds={unit.UnitMember.map((m) => m.memberId)}
            canPromoteLead={canPromoteLead}
            onCancel={() => setShowAdd(false)}
            onAdded={async (memberId, isLead) => {
              await onAddMember(unit.id, memberId, isLead);
              setShowAdd(false);
            }}
          />
        )}

        {unit.UnitMember.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
            No members in this unit yet.
          </p>
        ) : (
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
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{m.Member.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canPromoteLead && (
                    <button
                      type="button"
                      onClick={() => onToggleLead(unit.id, m.memberId, !m.isLead)}
                      title={m.isLead ? "Demote lead" : "Promote to lead"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        m.isLead
                          ? "text-emerald-600 hover:bg-gray-100 dark:hover:bg-white/5"
                          : "text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <Crown size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveMember(unit.id, m.memberId)}
                    title="Remove from unit"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <UserMinus size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}