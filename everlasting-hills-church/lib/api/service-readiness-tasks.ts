"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { ReadinessPlan, ReadinessTask } from "@/lib/api/service-readiness-plans";

type Where = { serviceId: string; unitId: string };
const tasksPath = ({ serviceId, unitId }: Where) =>
  `/service-readiness/services/${encodeURIComponent(serviceId)}/units/${encodeURIComponent(unitId)}/tasks`;

type Cached = { items?: { plan: ReadinessPlan }[]; rows?: ReadinessPlan[] } | undefined;

/** Changes one task in every cached readiness view at once, so a tick shows straight away. */
function patchTask(qc: QueryClient, taskId: string, change: (t: ReadinessTask) => ReadinessTask | null) {
  const fix = <P extends ReadinessPlan>(plan: P): P => ({
    ...plan,
    tasks: plan.tasks.flatMap((t) => (t.id === taskId ? [change(t)].filter((x): x is ReadinessTask => !!x) : [t])),
  });
  qc.setQueriesData<Cached>({ queryKey: ["service-readiness"] }, (data) => {
    if (data?.items) return { ...data, items: data.items.map((i) => ({ ...i, plan: fix(i.plan) })) };
    if (data?.rows) return { ...data, rows: data.rows.map(fix) };
    return data;
  });
}

function useRefresh() {
  const qc = useQueryClient();
  return { qc, refresh: () => qc.invalidateQueries({ queryKey: ["service-readiness"] }) };
}

/** Adds one or more tasks to a unit's plan. */
export function useAddReadinessTasks() {
  const { refresh } = useRefresh();
  return useMutation({
    mutationFn: ({ titles, ...where }: Where & { titles: string[] }) => api.post<{ added: number }>(tasksPath(where), { titles }),
    onSuccess: refresh,
  });
}

/** Ticks a task off (or back on). */
export function useToggleReadinessTask() {
  const { qc, refresh } = useRefresh();
  return useMutation({
    mutationFn: ({ taskId, done, ...where }: Where & { taskId: string; done: boolean }) =>
      api.patch<{ saved: boolean }>(`${tasksPath(where)}/${encodeURIComponent(taskId)}`, { done }),
    onMutate: ({ taskId, done }) => patchTask(qc, taskId, (t) => ({ ...t, done })),
    onSettled: refresh,
  });
}

export function useRemoveReadinessTask() {
  const { qc, refresh } = useRefresh();
  return useMutation({
    mutationFn: ({ taskId, ...where }: Where & { taskId: string }) =>
      api.delete<{ deleted: boolean }>(`${tasksPath(where)}/${encodeURIComponent(taskId)}`),
    onMutate: ({ taskId }) => patchTask(qc, taskId, () => null),
    onSettled: refresh,
  });
}
