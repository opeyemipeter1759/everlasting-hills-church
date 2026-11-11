"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useMyReadiness, type ReadinessServiceRef } from "@/lib/api/service-readiness-plans";
import ServiceTabs from "./tasks/ServiceTabs";
import UnitPlanCard from "./UnitPlanCard";

/** A unit leader's plan for each coming service: a task list per unit they lead. */
export default function MyReadiness() {
  const { data, isLoading, isError, refetch } = useMyReadiness();
  const [picked, setPicked] = useState<string | null>(null);

  const items = data?.items ?? [];
  const services: ReadinessServiceRef[] = [];
  for (const i of items) if (!services.some((s) => s.id === i.service.id)) services.push(i.service);
  const selectedId = services.some((s) => s.id === picked) ? picked : (services[0]?.id ?? null);
  const shown = items.filter((i) => i.service.id === selectedId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Service plan</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/55">
          List what your unit needs to get done for each service, send it to the Administrator, and tick tasks off as you go.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" aria-label="Loading" /></div>
      ) : isError || !data ? (
        <div role="alert" className="rounded-2xl border border-red-200 p-5 text-sm dark:border-red-900 dark:text-white/75">
          Your service plans could not load. <button type="button" onClick={() => refetch()} className="font-semibold underline">Try again</button>
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
          You don&apos;t lead a unit. Unit leads, assistants and heads of department see their units here.
        </p>
      ) : (
        <>
          {services.length > 1 && <ServiceTabs services={services} selectedId={selectedId} onSelect={setPicked} />}
          <div className="space-y-5">
            {shown.map((item) => <UnitPlanCard key={`${item.service.id}-${item.unit.id}`} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}
