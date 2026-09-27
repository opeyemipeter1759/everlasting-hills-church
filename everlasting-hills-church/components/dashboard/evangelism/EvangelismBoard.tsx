"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Home, ListChecks, Map, MessageSquareQuote, Trophy } from "lucide-react";
import { ShieldAlert } from "lucide-react";
import { useEvangelismMe, useEvangelismSummary } from "@/lib/api/evangelism";
import { BoardSkeleton } from "@/components/dashboard/follow-up/BoardSkeleton";
import { EvangelismHeader } from "./EvangelismHeader";
import { EVANGELISM_TABS_BOTTOM_SPACE, EvangelismTabs, type EvangelismTabDef } from "./EvangelismTabs";
import { OverviewTab } from "./OverviewTab";
import { TasksTab } from "./TasksTab";
import { OutreachesTab } from "./OutreachesTab";
import { TestimoniesTab } from "./TestimoniesTab";
import { TeamTab } from "./TeamTab";
import { ContactDrawer } from "./ContactDrawer";

export type EvangelismTab = "home" | "tasks" | "outreaches" | "testimonies" | "team";

const TABS: EvangelismTabDef<EvangelismTab>[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "outreaches", label: "Outreaches", shortLabel: "Outreach", icon: Map },
  { id: "testimonies", label: "Testimonies", shortLabel: "Stories", icon: MessageSquareQuote },
  { id: "team", label: "Team", icon: Trophy },
];

const isTab = (v: string | null): v is EvangelismTab => !!v && TABS.some((t) => t.id === v);
/** Home is now the list of everyone preached to, so old "?tab=contacts" links land there. */
const tabFrom = (v: string | null): EvangelismTab | null => (v === "contacts" ? "home" : isTab(v) ? v : null);

/**
 * The Evangelism Team's page. The tab and an open contact live in the URL
 * (?tab=tasks, ?contact=…) so a task email or a shared link lands in the
 * right place, and Back closes what you opened.
 */
export default function EvangelismBoard() {
  const me = useEvangelismMe();
  const summary = useEvangelismSummary();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const tabParam = params?.get("tab") ?? null;
  const [active, setActive] = useState<EvangelismTab>(tabFrom(tabParam) ?? "home");
  const contactId = params?.get("contact") ?? null;

  useEffect(() => {
    const tab = tabFrom(tabParam);
    if (tab) setActive(tab);
  }, [tabParam]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params?.toString() ?? "");
      if (value) next.set(key, value);
      else next.delete(key);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : (pathname ?? ""), { scroll: false });
    },
    [params, pathname, router],
  );

  const changeTab = (tab: EvangelismTab) => {
    setActive(tab);
    const next = new URLSearchParams(params?.toString() ?? "");
    next.set("tab", tab);
    next.delete("task");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const openContact = useCallback((id: string) => setParam("contact", id), [setParam]);
  const closeContact = useCallback(() => setParam("contact", null), [setParam]);

  if (me.isLoading) return <BoardSkeleton />;
  if (me.isError || !me.data) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#161618]">
        <ShieldAlert size={28} className="mx-auto text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
        <h1 className="mt-3 text-lg font-bold text-gray-900 dark:text-white">Evangelism is for the Evangelism Team</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
          {(me.error as { message?: string } | null)?.message ?? "Ask the unit leader to add you to the team."}
        </p>
      </div>
    );
  }

  const canLead = me.data.canLead;
  const s = summary.data;
  const counts: Partial<Record<EvangelismTab, number>> = s
    ? { tasks: s.mine.openTasks }
    : {};

  return (
    <div className={`mx-auto max-w-[1200px] space-y-5 md:px-2 ${EVANGELISM_TABS_BOTTOM_SPACE}`}>
      <EvangelismHeader summary={summary} />
      <EvangelismTabs tabs={TABS} active={active} counts={counts} onChange={changeTab} />

      <section role="tabpanel" aria-label={TABS.find((t) => t.id === active)?.label} className="pt-1">
        {active === "home" && <OverviewTab canLead={canLead} summary={summary} onOpenContact={openContact} />}
        {active === "tasks" && <TasksTab canLead={canLead} focusTaskId={params?.get("task") ?? null} onOpenContact={openContact} />}
        {active === "outreaches" && <OutreachesTab canLead={canLead} onOpenContact={openContact} />}
        {active === "testimonies" && <TestimoniesTab canLead={canLead} myMemberId={me.data.memberId} />}
        {active === "team" && <TeamTab canLead={canLead} unitId={me.data.unitId} />}
      </section>

      <ContactDrawer contactId={contactId} canLead={canLead} onClose={closeContact} />
    </div>
  );
}
