import { useEffect, useState } from "react";
import { api } from "@/lib/api/request";
import type { UnitDetail, UnitMemberEntry } from "@/types";

export interface MyUnitSummary {
  id: string;
  name: string;
  description: string | null;
  totalMembers: number;
  isLead: boolean;
  isAssistant: boolean;
}

export function useMyUnit() {
  // undefined = loading, null = no unit found
  const [summary, setSummary] = useState<MyUnitSummary | null | undefined>(undefined);
  const [unit, setUnit] = useState<UnitDetail | null>(null);

  useEffect(() => {
    api
      .get<MyUnitSummary | null>("/units/me")
      .then(async (result) => {
        setSummary(result ?? null);
        if (result?.id) {
          const detail = await api.get<UnitDetail>(`/units/${result.id}`);
          setUnit(detail);
        }
      })
      .catch(() => setSummary(null));
  }, []);

  async function addMember(unitId: string, memberId: string, isLead: boolean) {
    const entry = await api.post<UnitMemberEntry>(`/units/${unitId}/members`, { memberId, isLead });
    setUnit((prev) =>
      prev?.id === unitId
        ? {
            ...prev,
            UnitMember: [...prev.UnitMember, entry],
            _count: { UnitMember: prev._count.UnitMember + 1 },
          }
        : prev,
    );
    setSummary((prev) =>
      prev ? { ...prev, totalMembers: prev.totalMembers + 1 } : prev,
    );
  }

  async function removeMember(unitId: string, memberId: string) {
    if (!confirm("Remove this member from the unit?")) return;
    await api.delete(`/units/${unitId}/members/${memberId}`);
    setUnit((prev) =>
      prev?.id === unitId
        ? {
            ...prev,
            UnitMember: prev.UnitMember.filter((m) => m.memberId !== memberId),
            _count: { UnitMember: Math.max(0, prev._count.UnitMember - 1) },
          }
        : prev,
    );
    setSummary((prev) =>
      prev ? { ...prev, totalMembers: Math.max(0, prev.totalMembers - 1) } : prev,
    );
  }

  return { summary, unit, addMember, removeMember };
}
