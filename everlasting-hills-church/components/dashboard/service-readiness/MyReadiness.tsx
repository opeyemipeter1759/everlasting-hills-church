"use client";

import { Loader2 } from "lucide-react";
import { useMyReadiness } from "@/lib/api/service-readiness-plans";
import PlanCard from "./PlanCard";

/** Stage 1 for a unit leader: one card per unit they lead, for each coming service. */
export default function MyReadiness() {
  const { data, isLoading, isError, refetch } = useMyReadiness();
  return (
    <div className="space-y-5 px-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Service plan</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-white/55">
          Submit your unit&apos;s plan 24 hours before each service must be ready (Sunday by 7:45 am, Wednesday by 5:00 pm), then post an
          update when everything is ready or if something is blocking you.
        </p>
      </header>
      {isLoading ? (
        <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" aria-label="Loading" /></div>
      ) : isError || !data ? (
        <div role="alert" className="rounded-2xl border border-red-200 p-5 text-sm dark:border-red-900 dark:text-white/75">
          Your service plans could not load. <button type="button" onClick={() => refetch()} className="font-semibold underline">Try again</button>
        </div>
      ) : data.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
          You don&apos;t lead a unit. Unit leads, assistants and heads of department see their units here.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.items.map((item) => <PlanCard key={`${item.service.id}-${item.unit.id}`} item={item} />)}
        </ul>
      )}
    </div>
  );
}
