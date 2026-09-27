"use client";

import { ArrowRight, Flag, Hourglass, ListChecks } from "lucide-react";
import { useEvangelismContacts, useEvangelismTasks } from "@/lib/api/evangelism";
import { ContactList } from "./ContactList";
import { TaskCard } from "./TasksTab";
import { EmptyState, ErrorNote, Loading } from "./bits";
import { errorText } from "./labels";
import type { EvangelismTab } from "./EvangelismBoard";

/**
 * What needs doing today: my people still in their 30-day window, my open
 * tasks, and — for leaders — contacts whose window has run out.
 */
export function OverviewTab({
  canLead,
  onOpenContact,
  onGoTo,
}: {
  canLead: boolean;
  onOpenContact: (id: string) => void;
  onGoTo: (tab: EvangelismTab) => void;
}) {
  const mine = useEvangelismContacts({ mine: true, take: 50 });
  const tasks = useEvangelismTasks("mine");
  const review = useEvangelismContacts({ flag: "REVIEW", take: 20 });
  const openTasks = (tasks.data ?? []).filter((t) => t.status !== "DONE");

  return (
    <div className="space-y-8">
      <Block
        icon={Hourglass}
        title="My contacts in their 30-day window"
        count={mine.data?.total}
      >
        {mine.isLoading ? (
          <Loading />
        ) : mine.isError ? (
          <ErrorNote>{errorText(mine.error, "Couldn't load your contacts.")}</ErrorNote>
        ) : (mine.data?.data ?? []).length === 0 ? (
          <EmptyState icon={Hourglass} title="Nobody in their window right now" body="People you preach to show up here for 30 days of follow-up." />
        ) : (
          <ContactList rows={mine.data?.data ?? []} onOpen={onOpenContact} />
        )}
      </Block>

      <Block
        icon={ListChecks}
        title="My tasks"
        count={openTasks.length}
        action={
          <button type="button" onClick={() => onGoTo("tasks")} className="inline-flex items-center gap-1 text-xs font-bold text-[#87102C] dark:text-[#FFB3C1]">
            All tasks <ArrowRight size={13} aria-hidden="true" />
          </button>
        }
      >
        {tasks.isLoading ? (
          <Loading />
        ) : openTasks.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/40">No open tasks. </p>
        ) : (
          <ul className="space-y-3">
            {openTasks.slice(0, 5).map((t) => (
              <TaskCard key={t.id} task={t} canLead={canLead} onOpenContact={onOpenContact} />
            ))}
          </ul>
        )}
      </Block>

      {canLead && (review.data?.total ?? 0) > 0 && (
        <Block icon={Flag} title="Needs your review — 30 days are up" count={review.data?.total}>
          <ContactList rows={review.data?.data ?? []} onOpen={onOpenContact} />
        </Block>
      )}
    </div>
  );
}

function Block({
  icon: Icon,
  title,
  count,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
          <Icon size={15} aria-hidden="true" /> {title}
          {typeof count === "number" && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold normal-case tracking-normal text-gray-500 dark:bg-white/10 dark:text-white/60">
              {count}
            </span>
          )}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
