"use client";

import { useEffect, useState } from "react";
import { Download, Plus, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/navigation/Pagination";
import { showToast } from "@/components/ui/toast/toast";
import { downloadCsv } from "@/lib/export-csv";
import {
  fetchAllContacts,
  useEvangelismContacts,
  useEvangelismMe,
  useEvangelismTeam,
  useOutreaches,
  type ContactFilters,
  type ContactRow,
  type ContactStatus,
  type FollowUpFlag,
  type SavedStatus,
} from "@/lib/api/evangelism";
import { ContactList } from "./ContactList";
import { ContactDialog } from "./ContactDialog";
import { EmptyState, ErrorNote, Loading, cardClass, primaryButton, secondaryButton, selectClass } from "./bits";
import {
  FLAG_LABEL,
  NEXT_ACTION_LABEL,
  SAVED_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  displayPhone,
  errorText,
  fmtDate,
  inputClass,
} from "./labels";

const PAGE_SIZE = 25;

const EMPTY: ContactFilters = {
  search: "",
  workerMemberId: "",
  assigneeMemberId: "",
  outreachId: "",
  savedStatus: "",
  status: "",
  flag: "",
  from: "",
  to: "",
};

export function ContactsTab({ onOpenContact }: { canLead: boolean; onOpenContact: (id: string) => void }) {
  const me = useEvangelismMe();
  const team = useEvangelismTeam();
  const outreaches = useOutreaches();
  const [filters, setFilters] = useState<ContactFilters>(EMPTY);
  const [student, setStudent] = useState<"" | "yes" | "no">("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Type, pause, then search — not a request per keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => setFilters((f) => ({ ...f, search })), 300);
    return () => window.clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [filters, student, unreadOnly]);

  const extra: ContactFilters = {
    ...(student ? { isStudent: student === "yes" } : {}),
    ...(unreadOnly ? { unread: true } : {}),
  };
  const query: ContactFilters = {
    ...filters,
    ...extra,
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  };
  const contacts = useEvangelismContacts(query);
  const set = <K extends keyof ContactFilters>(key: K, value: ContactFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const hasFilters = Object.values(filters).some(Boolean) || !!student || unreadOnly;
  const activeFilters =
    Object.entries(filters).filter(([k, v]) => k !== "search" && !!v).length + (student ? 1 : 0) + (unreadOnly ? 1 : 0);

  function clear() {
    setFilters(EMPTY);
    setSearch("");
    setStudent("");
    setUnreadOnly(false);
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const { data } = await fetchAllContacts({ ...filters, ...extra });
      if (data.length === 0) {
        showToast.error("Nothing to export");
        return;
      }
      downloadCsv("evangelism-contacts", data.map(csvRow), [...CSV_COLUMNS]);
    } catch (err) {
      showToast.error(errorText(err, "Couldn't export"));
    } finally {
      setExporting(false);
    }
  }

  const total = contacts.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts"
            aria-label="Search contacts"
            className={`${inputClass} h-10 py-0 pl-10`}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label="Filters"
          className={`${secondaryButton} px-3 md:hidden`}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          {activeFilters > 0 && <span className="rounded-full bg-[#87102C] px-1.5 text-[11px] font-semibold text-white">{activeFilters}</span>}
        </button>
        <button type="button" onClick={exportCsv} disabled={exporting} aria-label="Export" title="Export to Excel (CSV)" className={`${secondaryButton} px-3 sm:px-4`}>
          <Download size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export"}</span>
        </button>
        <button type="button" onClick={() => setAdding(true)} aria-label="Add contact" className={`${primaryButton} px-3 sm:px-4`}>
          <Plus size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Add contact</span>
        </button>
      </div>

      <div className={`${showFilters ? "grid" : "hidden"} grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid lg:grid-cols-5`}>
        <Select
          aria-label="Preached by"
          prefixLabel="Preached by:"
          className={selectClass}
          value={filters.workerMemberId ?? ""}
          onChange={(v) => set("workerMemberId", v)}
          options={[{ value: "", label: "Anyone" }, ...(team.data ?? []).map((m) => ({ value: m.id, label: m.name }))]}
        />
        <Select
          aria-label="Following up"
          prefixLabel="Following up:"
          className={selectClass}
          value={filters.assigneeMemberId ?? ""}
          onChange={(v) => set("assigneeMemberId", v)}
          options={[{ value: "", label: "Anyone" }, ...(team.data ?? []).map((m) => ({ value: m.id, label: m.name }))]}
        />
        <Select
          aria-label="Outreach"
          prefixLabel="Outreach:"
          className={selectClass}
          value={filters.outreachId ?? ""}
          onChange={(v) => set("outreachId", v)}
          options={[
            { value: "", label: "All" },
            { value: "none", label: "Personal evangelism" },
            ...(outreaches.data?.outreaches ?? []).map((o) => ({ value: o.id, label: o.name })),
          ]}
        />
        <Select
          aria-label="Saved"
          prefixLabel="Saved:"
          className={selectClass}
          value={filters.savedStatus ?? ""}
          onChange={(v) => set("savedStatus", v as SavedStatus | "")}
          options={[{ value: "", label: "Any" }, ...(Object.keys(SAVED_LABEL) as SavedStatus[]).map((k) => ({ value: k, label: SAVED_LABEL[k] }))]}
        />
        <Select
          aria-label="Student"
          prefixLabel="Student:"
          className={selectClass}
          value={student}
          onChange={(v) => setStudent(v as "" | "yes" | "no")}
          options={[
            { value: "", label: "Any" },
            { value: "yes", label: "Students" },
            { value: "no", label: "Not students" },
          ]}
        />
        <Select
          aria-label="Status"
          prefixLabel="Status:"
          className={selectClass}
          value={filters.status ?? ""}
          onChange={(v) => set("status", v as ContactStatus | "")}
          options={[{ value: "", label: "Any" }, ...STATUS_ORDER.map((k) => ({ value: k, label: STATUS_LABEL[k] }))]}
        />
        <Select
          aria-label="Follow-up"
          prefixLabel="Follow-up:"
          className={selectClass}
          value={filters.flag ?? ""}
          onChange={(v) => set("flag", v as FollowUpFlag | "")}
          options={[{ value: "", label: "Any" }, ...(Object.keys(FLAG_LABEL) as FollowUpFlag[]).map((k) => ({ value: k, label: FLAG_LABEL[k] }))]}
        />
        <Select
          aria-label="Feedback"
          prefixLabel="Feedback:"
          className={selectClass}
          value={unreadOnly ? "unread" : ""}
          onChange={(v) => setUnreadOnly(v === "unread")}
          options={[
            { value: "", label: "Any" },
            { value: "unread", label: "Unread by me" },
          ]}
        />
        <DateField label="From" value={filters.from ?? ""} onChange={(v) => set("from", v)} />
        <DateField label="To" value={filters.to ?? ""} onChange={(v) => set("to", v)} />
      </div>

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex h-12 items-center justify-between gap-3 border-b border-gray-100 px-5 text-sm dark:border-white/[0.06]">
          <p className="text-gray-500 dark:text-white/50">
            {contacts.data ? (
              <>
                <span className="font-semibold text-gray-900 dark:text-white">{total}</span> {total === 1 ? "contact" : "contacts"}
                {hasFilters ? " match" : ""}
              </>
            ) : null}
          </p>
          {hasFilters && (
            <button type="button" onClick={clear} className="inline-flex items-center gap-1 font-semibold text-gray-500 hover:text-gray-900 dark:text-white/50 dark:hover:text-white">
              <X size={14} aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>

        {contacts.isLoading ? (
          <Loading />
        ) : contacts.isError ? (
          <div className="p-5">
            <ErrorNote>{errorText(contacts.error, "Couldn't load contacts.")}</ErrorNote>
          </div>
        ) : total === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={Search}
              title="No contacts match these filters"
              action={
                <button type="button" onClick={clear} className={secondaryButton}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No contacts yet"
              body="Share the outreach form with the team, or add someone yourself."
              action={
                <button type="button" onClick={() => setAdding(true)} className={primaryButton}>
                  <Plus size={16} aria-hidden="true" /> Add contact
                </button>
              }
            />
          )
        ) : (
          <ContactList rows={contacts.data?.data ?? []} onOpen={onOpenContact} bare />
        )}

        {pageCount > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-white/[0.06] dark:text-white/45 sm:flex-row">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
          </div>
        )}
      </section>

      <ContactDialog open={adding} onClose={() => setAdding(false)} defaultWorkerId={me.data?.memberId} onCreated={onOpenContact} />
    </div>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white pl-3 pr-2 text-sm hover:border-gray-300 dark:border-white/10 dark:bg-white/[0.04]">
      <span className="shrink-0 text-gray-500 dark:text-white/45">{label}:</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-700 focus:outline-none dark:text-white/80 dark:[color-scheme:dark]"
      />
    </label>
  );
}

type CsvRow = Record<(typeof CSV_COLUMNS)[number]["key"], string | number>;

const CSV_COLUMNS = [
  { key: "name", header: "Name" },
  { key: "phone", header: "Phone" },
  { key: "address", header: "Address" },
  { key: "saved", header: "Saved" },
  { key: "student", header: "Student" },
  { key: "school", header: "School" },
  { key: "level", header: "Level" },
  { key: "worker", header: "Worker" },
  { key: "outreach", header: "Outreach" },
  { key: "contactDate", header: "Date of contact" },
  { key: "days", header: "Days since contact" },
  { key: "status", header: "Status" },
  { key: "followUp", header: "Follow-up" },
  { key: "nextAction", header: "Next action" },
  { key: "consent", header: "Consented to contact" },
] as const;

function csvRow(c: ContactRow): CsvRow {
  return {
    name: c.name,
    phone: displayPhone(c.phone),
    address: c.address,
    saved: SAVED_LABEL[c.savedStatus],
    student: c.isStudent ? "Yes" : "No",
    school: c.school ?? "",
    level: c.level ?? "",
    worker: c.worker.name,
    outreach: c.outreach?.name ?? "Personal evangelism",
    contactDate: fmtDate(c.contactDate),
    days: c.daysSinceContact,
    status: STATUS_LABEL[c.status],
    followUp: c.window.flag ? FLAG_LABEL[c.window.flag] : c.window.open ? `Day ${c.window.day} of ${c.window.of}` : "Finished",
    nextAction: c.nextAction ? NEXT_ACTION_LABEL[c.nextAction] : "",
    consent: c.consent ? "Yes" : "No",
  };
}
