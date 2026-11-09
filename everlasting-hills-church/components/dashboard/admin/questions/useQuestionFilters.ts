import { useState } from "react";
import type { QuestionRow, QuestionStatus } from "@/lib/api/questions";
import { groupByDay } from "@/lib/utils/time";

/** Search, date range and status tab for the questions list, applied to the loaded list. */
export function useQuestionFilters(questions: QuestionRow[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<QuestionStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const term = search.trim().toLowerCase();
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

  const filtered = questions.filter((r) => {
    if (status && r.status !== status) return false;
    const submitted = new Date(r.submittedAt);
    if (from && submitted < from) return false;
    if (to && submitted > to) return false;
    if (term) {
      const displayName = r.member ? `${r.member.firstName} ${r.member.lastName}` : r.name ?? "";
      const haystack = `${r.question} ${displayName} ${r.email ?? ""} ${r.member?.email ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  function clearFilters() {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  }

  return {
    search, setSearch, status, setStatus, dateFrom, setDateFrom, dateTo, setDateTo,
    filtered,
    groups: groupByDay(filtered, (r) => r.submittedAt),
    hasFilters: !!(search || status || dateFrom || dateTo),
    clearFilters,
  };
}

export type QuestionFilterState = ReturnType<typeof useQuestionFilters>;
