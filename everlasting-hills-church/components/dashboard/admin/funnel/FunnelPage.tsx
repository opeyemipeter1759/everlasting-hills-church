"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Filter } from "lucide-react";
import MasterList from "@/components/dashboard/follow-up/MasterList";
import { stageFor } from "@/lib/funnel-stages";
import type { MasterListStatus } from "@/lib/api/follow-up-pipeline";
import { FunnelStageTabs } from "./FunnelStageTabs";

/**
 * Everyone in the funnel, in full.
 *
 * The dashboard card says how many are at each stage; this says who they are.
 * It is the same table the Follow Up team works from — open anyone for their
 * details, their history and the team's conversation about them.
 */
export default function FunnelPage() {
  const params = useSearchParams();
  const stage = stageFor(params?.get("status"));
  const status = (stage?.status ?? "") as MasterListStatus | "";

  return (
    <div className="space-y-5 md:px-2">
      <div>
        <Link
          href="/dashboard/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-[#87102C] dark:text-white/50 dark:hover:text-[#FFB3C1]"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to the dashboard
        </Link>

        <h1 className="mt-3 flex items-center gap-2.5 text-2xl font-bold text-[#111] dark:text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFE8ED] dark:bg-[#87102C]/25">
            <Filter size={18} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
          </span>
          {stage ? stage.label : "Newcomer funnel"}
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-white/45">
          {stage ? stage.note : "Everyone the church is responsible for, wherever they have got to."}
        </p>
      </div>

      <FunnelStageTabs active={stage?.status ?? null} />

      {/* `key` remounts the table when the stage changes, so paging starts again at one. */}
      <MasterList key={status || "all"} fixed={status ? { status } : undefined} />
    </div>
  );
}
