"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { MasterListRow } from "@/lib/api/follow-up-pipeline";
import { usePipeline, type PipelinePage, type PipelineQuery, type PipelineStatus } from "@/lib/api/pipeline";
import { PeopleTable } from "./v2/PeopleTable";
import { useMonthYearParams } from "./v2/MonthYearFilter";
import { PersonDrawer } from "./PersonDrawer";
import { MasterListChips } from "./MasterListChips";
import { MasterListPager } from "./MasterListPager";
import { MasterListToolbar, useDebounced } from "./MasterListToolbar";
import { NotesButton, useOpenLinkedThread } from "./MasterListNotes";

export const profileHref = (row: { visitorId: string }) => `/dashboard/follow-up/person/${row.visitorId}`;

/**
 * A list of first-timers read from the pipeline: status chips whose counts
 * double as filters, search, who has them, the month and year of their first
 * visit, and server-side pages. The counts, the total and the rows all come
 * from one API call under the same filters, so they always agree.
 *
 * `fixed` pins part of the query: Assigned to me pins the assignee, Opted out
 * pins the status. Each row opens the full profile; Notes opens the team's
 * conversation about them.
 */
export default function MasterListPipeline({
  fixed = {},
  defaultStatus = "",
  linkThreads = false,
  filters,
  empty,
  onPage,
}: {
  fixed?: Pick<PipelineQuery, "status" | "assigneeId" | "absentFrom">;
  /** The chip it opens on; the viewer can change it. */
  defaultStatus?: PipelineStatus | "";
  /** Open the conversation an alert links to (`?thread=KIND:id`). Only the main list does this. */
  linkThreads?: boolean;
  /** Extra filters for the toolbar, e.g. Absent from on the Integration page. */
  filters?: ReactNode;
  empty?: ReactNode;
  /** Told each page of results, e.g. for figures above the list that must match it. */
  onPage?: (page: PipelinePage | undefined) => void;
}) {
  const { year, month } = useMonthYearParams();
  const [status, setStatus] = useState<PipelineStatus | "">(defaultStatus);
  const [typed, setTyped] = useState("");
  const search = useDebounced(typed);
  const [assigneeId, setAssigneeId] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [person, setPerson] = useState<MasterListRow | null>(null);
  useOpenLinkedThread(linkThreads, setPerson);

  const query: PipelineQuery = {
    status: fixed.status ?? status,
    assigneeId: fixed.assigneeId ?? assigneeId,
    absentFrom: fixed.absentFrom,
    search,
    year,
    month,
    take: pageSize,
    skip: page * pageSize,
  };
  // Any change of filter starts again at the first page.
  const filterKey = JSON.stringify({ ...query, take: undefined, skip: undefined });
  useEffect(() => setPage(0), [filterKey]);

  const { data, isLoading, isFetching } = usePipeline(query);
  useEffect(() => onPage?.(data), [data, onPage]);

  return (
    <div className="space-y-3">
      <MasterListToolbar
        search={typed}
        onSearch={setTyped}
        assigneeId={assigneeId}
        onAssignee={fixed.assigneeId ? undefined : setAssigneeId}
      >
        {filters}
      </MasterListToolbar>

      {!fixed.status && <MasterListChips counts={data?.counts} value={status} onChange={setStatus} />}

      <PeopleTable
        rows={data?.rows ?? []}
        loading={isLoading}
        profileHref={profileHref}
        renderActions={(row) => <NotesButton row={row} onOpen={setPerson} />}
        empty={empty}
      />

      <MasterListPager
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        busy={isFetching && !isLoading}
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size);
          setPage(0);
        }}
      />

      <PersonDrawer person={person} onClose={() => setPerson(null)} />
    </div>
  );
}
