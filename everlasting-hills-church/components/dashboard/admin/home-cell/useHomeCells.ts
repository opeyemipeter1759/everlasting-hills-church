"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/api/axios";

export interface HomeCell {
  id: string;
  name: string;
  leaderName: string;
  leaderPhone: string | null;
  meetingDay: string;
  meetingTime: string;
  address: string;
  city: string;
  state: string;
  isActive: boolean;
  createdAt: string;
}

export type HomeCellFilter = "ALL" | "ACTIVE" | "PENDING";

export interface HomeCellFormValues {
  name: string;
  leaderPhone: string;
  meetingDay: string;
  meetingTime: string;
  state: string;
  city: string;
  addressDetail: string;
}

function buildAddress(city: string, detail: string) {
  return [city.trim(), detail.trim()].filter(Boolean).join(", ");
}

export function useHomeCells() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<HomeCellFilter>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<HomeCell | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HomeCell | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["home-cells-admin"],
    queryFn: async () => (await apiClient.get<HomeCell[]>("/home-cell/admin/all")).data,
  });

  const counts = useMemo(() => ({
    ALL: items.length,
    ACTIVE: items.filter((c) => c.isActive).length,
    PENDING: items.filter((c) => !c.isActive).length,
  }), [items]);

  const filtered = useMemo(() => {
    if (filter === "ACTIVE")  return items.filter((c) => c.isActive);
    if (filter === "PENDING") return items.filter((c) => !c.isActive);
    return items;
  }, [items, filter]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["home-cells-admin"] });
  }

  const createMutation = useMutation({
    mutationFn: (v: HomeCellFormValues) =>
      apiClient.post("/home-cell/admin", {
        name: v.name.trim(),
        leaderName: "",
        leaderPhone: v.leaderPhone.trim(),
        meetingDay: v.meetingDay,
        meetingTime: v.meetingTime.trim(),
        address: buildAddress(v.city, v.addressDetail) || v.state,
        city: v.city.trim() || v.state,
        state: v.state,
      }),
    onSuccess: () => {
      setModalOpen(false);
      toast.success("Home Cell registered");
      invalidate();
    },
    onError: () => toast.error("Failed to register cell"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/home-cell/${id}/approve`),
    onSuccess: () => {
      setApproveTarget(null);
      toast.success("Cell approved and now live");
      invalidate();
    },
    onError: () => toast.error("Failed to approve"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/home-cell/${id}`),
    onSuccess: () => {
      setDeleteTarget(null);
      toast.success("Cell removed");
      invalidate();
    },
    onError: () => toast.error("Failed to remove"),
  });

  return {
    items: filtered,
    isLoading,
    filter, setFilter,
    counts,
    modalOpen, setModalOpen,
    approveTarget, setApproveTarget,
    deleteTarget, setDeleteTarget,
    createMutation,
    approveMutation,
    deleteMutation,
  };
}
