import { useMemo, useRef, useState } from "react";
import { userMessageForError } from "@/lib/api/user-message";
import { useClearGoneQuiet, useReadingMonitor, useRemoveMemberPlan, type Reader, type ReaderPlan } from "@/lib/api/admin-reading";
import { useReadingPlans } from "@/lib/api/reading-plan";
import { inGroup, ORDER, type Filter } from "./shared";

/** Data, filters, notices and the clear / remove / share actions for the reading monitor. */
export function useReadingMonitorPage() {
  const monitor = useReadingMonitor();
  const data = monitor.data;
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shared, setShared] = useState<{ title: string; recipients: number } | null>(null);
  // Only the share dialog needs the plan catalogue, so it loads when that opens.
  const plans = useReadingPlans(undefined, { enabled: shareOpen });

  const clearGoneQuiet = useClearGoneQuiet();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [cleared, setCleared] = useState<{ removedPlans: number; members: number } | null>(null);
  const clearable = data?.clearable;

  const removeMemberPlan = useRemoveMemberPlan();
  const [removing, setRemoving] = useState<{ reader: Reader; plan: ReaderPlan } | null>(null);
  const [removedPlan, setRemovedPlan] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function confirmClear() {
    if (!clearable) return;
    setActionError(null);
    try {
      setCleared(await clearGoneQuiet.mutateAsync(clearable.plans));
    } catch (cause) {
      setActionError(userMessageForError(cause, "Could not clear gone quiet. Refresh the page and try again."));
    } finally {
      setConfirmingClear(false);
    }
  }

  async function confirmRemovePlan() {
    if (!removing?.plan.subscriptionId) return;
    setActionError(null);
    try {
      await removeMemberPlan.mutateAsync(removing.plan.subscriptionId);
      setRemovedPlan(`Removed ${removing.plan.title} from ${removing.reader.name}. The days they read stay in their history.`);
    } catch (cause) {
      setActionError(userMessageForError(cause, "Could not remove this plan. Please try again."));
    } finally {
      setRemoving(null);
    }
  }

  /** A tile shows the people behind its number. */
  function showGroup(next: Filter) {
    setFilter(next);
    setSearch("");
    listRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.readers ?? [])
      .filter((reader) => inGroup(reader, filter))
      .filter((reader) => !term || reader.name.toLowerCase().includes(term))
      .sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state) || a.name.localeCompare(b.name));
  }, [data, filter, search]);

  return {
    ...monitor,
    filter, setFilter, search, setSearch, listRef, rows, showGroup,
    finishedSomething: (data?.readers ?? []).filter((reader) => inGroup(reader, "HAS_FINISHED")).length,
    shareOpen, setShareOpen, shared, setShared, plans,
    clearable, clearGoneQuiet, confirmingClear, setConfirmingClear, cleared, confirmClear,
    removeMemberPlan, removing, setRemoving, removedPlan, confirmRemovePlan,
    actionError, setActionError,
  };
}

export type ReadingMonitorPage = ReturnType<typeof useReadingMonitorPage>;
