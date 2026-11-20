"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import type { CaseDetail } from "@/lib/api/premarital";
import { usePeople } from "@/lib/api/people";
import { useDebounced } from "@/components/dashboard/follow-up/MasterListToolbar";
import { card, input, primary, secondary, selectBox, useRun } from "../ui";

/** Who counsels this couple. Pastors and Super Admins assign; the lead gets the couple's "counsellor arranged" email. */
export function CounsellorsPanel({ c }: { c: CaseDetail }) {
  const active = c.assignments.filter((a) => a.active);
  return (
    <section aria-labelledby="counsellors-heading" className={card}>
      <h2 id="counsellors-heading" className="text-base font-bold text-[#111] dark:text-white">Counsellors</h2>
      {active.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-white/60">No counsellor yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {active.map((a) => (
            <AssignmentRow key={a.id} a={a} canEnd={c.can.assign} />
          ))}
        </ul>
      )}
      {c.can.assign && <AssignForm caseId={c.id} />}
    </section>
  );
}

function AssignmentRow({ a, canEnd }: { a: CaseDetail["assignments"][number]; canEnd: boolean }) {
  const { run, pending } = useRun();
  return (
    <li className="flex items-center justify-between gap-2 text-sm text-[#111] dark:text-white/90">
      <span>
        {a.name ?? "A team member"}
        {a.isLead && <span className="ml-2 rounded-full bg-[#FFE8ED] px-2 py-0.5 text-xs font-semibold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#f3a9b8]">Lead</span>}
      </span>
      {canEnd && (
        <button type="button" className="min-h-10 px-2 text-xs font-semibold text-gray-700 underline-offset-2 hover:underline dark:text-white/65" disabled={pending} onClick={() => run("delete", `/premarital/assignments/${a.id}`, undefined, "Counsellor removed from this case")}>
          Remove
        </button>
      )}
    </li>
  );
}

function AssignForm({ caseId }: { caseId: string }) {
  const { run, pending } = useRun();
  const [search, setSearch] = useState("");
  const [profileId, setProfileId] = useState("");
  const [lead, setLead] = useState(true);
  const settled = useDebounced(search);
  const people = usePeople({ search: settled, limit: 10, sortBy: "name", sortOrder: "asc" }, { enabled: settled.trim().length >= 2 });
  const options = (people.data?.data ?? []).filter((p) => p.profileId).map((p) => ({ value: p.profileId!, label: p.name }));

  async function assign() {
    if (await run("post", `/premarital/applications/${caseId}/assignments`, { counsellorProfileId: profileId, isLead: lead }, lead ? "Lead counsellor assigned" : "Counsellor added")) {
      setProfileId("");
      setSearch("");
    }
  }

  return (
    <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a counsellor by name" aria-label="Find a counsellor by name" className={input} />
      {options.length > 0 && <Select value={profileId} onChange={setProfileId} options={options} placeholder="Pick a person" aria-label="Counsellor" className={selectBox} />}
      <label className="flex min-h-10 items-center gap-2 text-sm text-[#111] dark:text-white/85">
        <input type="checkbox" className="h-5 w-5 accent-[#87102C]" checked={lead} onChange={(e) => setLead(e.target.checked)} />
        Make them the lead counsellor
      </label>
      <div className="flex gap-2">
        <button type="button" className={primary} disabled={!profileId || pending} onClick={assign}>
          Assign
        </button>
        {search && (
          <button type="button" className={secondary} onClick={() => { setSearch(""); setProfileId(""); }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
