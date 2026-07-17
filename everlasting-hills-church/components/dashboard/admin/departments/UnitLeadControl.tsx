"use client";

import { useState } from "react";
import { UserCog, UserPlus, Check } from "lucide-react";
import HeadPicker from "./HeadPicker";
import { useAppointUnitLead } from "@/lib/api/departments";

/**
 * Appoint or replace a unit's lead. Used by Admin Heads (scoped to their
 * department, enforced server-side) and by Pastor/Admin on any unit. Reuses the
 * church-member person picker; the replace confirmation shows whose tenure ends.
 */
export default function UnitLeadControl({
  unitId,
  leadName,
  onDone,
}: {
  unitId: string;
  leadName: string | null;
  onDone?: () => void;
}) {
  const appoint = useAppointUnitLead();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      {done ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <Check size={13} /> Lead updated
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-white/70 hover:border-[#87102C]/30 hover:text-[#87102C]"
        >
          {leadName ? <UserCog size={13} /> : <UserPlus size={13} />}
          {leadName ? "Replace lead" : "Appoint lead"}
        </button>
      )}

      <HeadPicker
        open={open}
        onClose={() => setOpen(false)}
        pending={appoint.isPending}
        currentHeadName={leadName}
        title={leadName ? "Replace unit lead" : "Assign unit lead"}
        subtitle={leadName ? `Replacing ${leadName} ends their tenure` : "Pick the person to lead this unit"}
        onPick={async (profileId) => {
          await appoint.mutateAsync({ unitId, profileId });
          setOpen(false);
          setDone(true);
          setTimeout(() => setDone(false), 2500);
          onDone?.();
        }}
      />
    </>
  );
}
