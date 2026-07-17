import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import type { ServiceRow } from "./types";

export interface ServiceInput {
  name: string;
  scheduledAt: string;
  serviceType: string;
}

function errorMessage(err: unknown, fallback: string) {
  return (err as { message?: string })?.message ?? fallback;
}

export function useServices() {
  const qc = useQueryClient();

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await apiClient.get<ServiceRow[]>("/attendance/services")).data,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["services"] });

  const create = useMutation({
    mutationFn: (input: ServiceInput) =>
      apiClient.post("/attendance/services", {
        ...input,
        scheduledAt: new Date(input.scheduledAt).toISOString(),
      }),
    onSuccess: () => {
      showToast.success("Service created");
      invalidate();
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't create service")),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ServiceInput }) =>
      apiClient.patch(`/attendance/services/${id}`, {
        ...input,
        scheduledAt: new Date(input.scheduledAt).toISOString(),
      }),
    onSuccess: () => {
      showToast.success("Service updated");
      invalidate();
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't update service")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/attendance/services/${id}`),
    onSuccess: () => {
      showToast.success("Service deleted");
      invalidate();
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't delete service")),
  });

  const toggle = useMutation({
    mutationFn: ({ id, open }: { id: string; open: boolean }) =>
      apiClient.patch(`/attendance/services/${id}/${open ? "open" : "close"}`),
    onSuccess: (_data, { open }) => {
      showToast.success(open ? "Check-in opened" : "Check-in closed");
      invalidate();
    },
    onError: (err) => showToast.error(errorMessage(err, "Couldn't update check-in status")),
  });

  async function exportCsv(id: string) {
    const res = await apiClient.get<{ filename: string; csv: string }>(`/attendance/services/${id}/export`);
    const blob = new Blob([res.data.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.data.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { services, isLoading, create, update, remove, toggle, exportCsv };
}

export type ServicesApi = ReturnType<typeof useServices>;
