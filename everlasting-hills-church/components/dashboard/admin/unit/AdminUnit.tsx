"use client";

import { useEffect, useState } from "react";
import { Network, Plus } from "lucide-react";
import { getFrontendSessionUser } from "@/lib/auth/frontend-session";
import { isAdminPlus, type Role } from "@/types";
import UnitList from "./UnitList";
import CreateUnitForm from "./CreateUnitForm";
import UnitDetailPanel from "./UnitDetailPanel";
import AdminUnitSkeleton from "@/components/ui/skeleton/AdminUnitSkeleton";
import {
  useUnitsList,
  useUnitDetail,
  useCreateUnit,
  useDeleteUnit,
  useAddUnitMember,
  useRemoveUnitMember,
  useSetUnitMemberRole,
} from "@/lib/api";

export default function AdminUnit() {
  const [creating, setCreating] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const { data: units, isLoading: unitsLoading } = useUnitsList();
  const { data: selectedUnit } = useUnitDetail(selectedUnitId);

  const createUnit = useCreateUnit();
  const deleteUnit = useDeleteUnit();
  const addMember = useAddUnitMember();
  const removeMember = useRemoveUnitMember();
  const setMemberRole = useSetUnitMemberRole();

  useEffect(() => {
    setRole((getFrontendSessionUser()?.role as Role) ?? "ADMIN");
  }, []);

  const canCreateUnit = isAdminPlus(role);
  const canPromoteLead = isAdminPlus(role);

  const unitList = units ?? [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Units</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {unitsLoading
              ? "Loading…"
              : `${unitList.length} unit${unitList.length !== 1 ? "s" : ""}`}
            {role === "UNIT_LEAD" && " — you can add/remove members in units you lead"}
          </p>
        </div>
        {canCreateUnit && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
          >
            <Plus size={15} />
            New unit
          </button>
        )}
      </div>

      {creating && (
        <CreateUnitForm
          onCancel={() => setCreating(false)}
          onCreate={async (name, description) => {
            await createUnit.mutateAsync({ name, description });
            setCreating(false);
          }}
        />
      )}

      {unitsLoading && <AdminUnitSkeleton />}

      {!unitsLoading && unitList.length === 0 && !creating && (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
          <Network size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No units yet</p>
        </div>
      )}

      {!unitsLoading && unitList.length > 0 && (
        <div className="grid lg:grid-cols-5 gap-5">
          <UnitList
            units={unitList}
            selectedId={selectedUnitId}
            onSelect={(unitId) => setSelectedUnitId(unitId)}
          />

          <div className="lg:col-span-3">
            {selectedUnit ? (
              <UnitDetailPanel
                unit={selectedUnit}
                role={role}
                canDelete={canCreateUnit}
                canPromoteLead={canPromoteLead}
                onAddMember={async (unitId, memberId, isLead) => {
                  await addMember.mutateAsync({ unitId, memberId, isLead });
                }}
                onRemoveMember={async (unitId, memberId) => {
                  await removeMember.mutateAsync({ unitId, memberId });
                }}
                onToggleLead={async (unitId, memberId, isLead) => {
                  await setMemberRole.mutateAsync({ unitId, memberId, isLead });
                }}
                onDeleteUnit={async (unit) => {
                  await deleteUnit.mutateAsync(unit.id);
                  if (selectedUnitId === unit.id) setSelectedUnitId(null);
                }}
              />
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-white dark:bg-[#1c1c1e] border border-dashed border-gray-200 dark:border-white/10 rounded-xl text-center px-6">
                <div>
                  <Network size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pick a unit on the left to see its members.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
