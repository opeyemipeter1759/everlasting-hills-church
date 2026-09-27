"use client";

import { useEffect, useState } from "react";
import { Download, Plus, Search, Users, X } from "lucide-react";
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
import { EmptyState, ErrorNote, Loading, primaryButton, secondaryButton } from "./bits";
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
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Type, pause, then search — not a request per keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => setFilters((f) => ({ ...f, search })), 300);
    return () => window.clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [filters, student]);

  const query: ContactFilters = {
    ...filters,
    ...(student ? { isStudent: student === "yes" } : {}),
    take: PAGE_SIZE,
    skip: (page - 1) * PAGE_SIZE,
  };
  const contacts = useEvangelismContacts(query);
  const set = <K extends keyof ContactFilters>(key: K, value: ContactFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const hasFilters = Object.values(filters).some(Boolean) || !!student;

  function clear() {
    setFilters(EMPTY);
    setSearch("");
    setStudent("");
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const { data } = await fetchAllContacts({ ...filters, ...(student ? { isStudent: student === "yes" } : {}) });
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, address or worker…"
            aria-label="Search contacts"
            className={`${inputClass} pl-9`}
          />
        </div>
        <button type="button" onClick={exportCsv} disabled={exporting} className={secondaryButton}>
          <Download size={15} aria-hidden="true" /> {exporting ? "Exporting…" : "Export"}
        </button>
        <button type="button" onClick={() => setAdding(true)} className={primaryButton}>
          <Plus size={15} aria-hidden="true" /> Add contact
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Select
          aria-label="Worker"
          value={filters.workerMemberId ?? ""}
          onChange={(v) => set("workerMemberId", v)}
          options={[{ value: "", label: "All workers" }, ...(team.data ?? []).map((m) => ({ value: m.id, label: m.name }))]}
        />
        <Select
          aria-label="Outreach"
          value={filters.outreachId ?? ""}
          onChange={(v) => set("outreachId", v)}
          options={[
            { value: "", label: "All outreaches" },
            { value: "none", label: "Personal evangelism" },
            ...(outreaches.data?.outreaches ?? []).map((o) => ({ value: o.id, label: o.name })),
          ]}
        />
        <Select
          aria-label="Saved"
          value={filters.savedStatus ?? ""}
          onChange={(v) => set("savedStatus", v as SavedStatus | "")}
          options={[{ value: "", label: "Saved: any" }, ...(Object.keys(SAVED_LABEL) as SavedStatus[]).map((k) => ({ value: k, label: SAVED_LABEL[k] }))]}
        />
        <Select
          aria-label="Student"
          value={student}
          onChange={(v) => setStudent(v as "" | "yes" | "no")}
          options={[
            { value: "", label: "Students: any" },
            { value: "yes", label: "Students" },
            { value: "no", label: "Not students" },
          ]}
        />
        <Select
          aria-label="Status"
          value={filters.status ?? ""}
          onChange={(v) => set("status", v as ContactStatus | "")}
          options={[{ value: "", label: "Any status" }, ...STATUS_ORDER.map((k) => ({ value: k, label: STATUS_LABEL[k] }))]}
        />
        <Select
          aria-label="Follow-up"
          value={filters.flag ?? ""}
          onChange={(v) => set("flag", v as FollowUpFlag | "")}
          options={[{ value: "", label: "Any follow-up" }, ...(Object.keys(FLAG_LABEL) as FollowUpFlag[]).map((k) => ({ value: k, label: FLAG_LABEL[k] }))]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1.5 text-gray-500 dark:text-white/50">
          From
          <input type="date" value={filters.from ?? ""} onChange={(e) => set("from", e.target.value)} className={`${inputClass} w-auto py-1.5`} />
        </label>
        <label className="flex items-center gap-1.5 text-gray-500 dark:text-white/50">
          to
          <input type="date" value={filters.to ?? ""} onChange={(e) => set("to", e.target.value)} className={`${inputClass} w-auto py-1.5`} />
        </label>
        {hasFilters && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white">
            <X size={13} aria-hidden="true" /> Clear filters
          </button>
        )}
        <span className="ml-auto text-gray-400 dark:text-white/40">{contacts.data ? `${total} contact${total === 1 ? "" : "s"}` : ""}</span>
      </div>

      {contacts.isLoading ? (
        <Loading />
      ) : contacts.isError ? (
        <ErrorNote>{errorText(contacts.error, "Couldn't load contacts.")}</ErrorNote>
      ) : total === 0 ? (
        hasFilters ? (
          <EmptyState icon={Search} title="No contacts match" action={<button type="button" onClick={clear} className={secondaryButton}>Clear filters</button>} />
        ) : (
          <EmptyState
            icon={Users}
            title="No contacts yet"
            body="Share the outreach form with the team, or add someone here."
            action={<button type="button" onClick={() => setAdding(true)} className={primaryButton}><Plus size={15} aria-hidden="true" /> Add contact</button>}
          />
        )
      ) : (
        <>
          <ContactList rows={contacts.data?.data ?? []} onOpen={onOpenContact} />
          {pageCount > 1 && (
            <div className="flex justify-center">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <ContactDialog
        open={adding}
        onClose={() => setAdding(false)}
        defaultWorkerId={me.data?.memberId}
        onCreated={onOpenContact}
      />
    </div>
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
