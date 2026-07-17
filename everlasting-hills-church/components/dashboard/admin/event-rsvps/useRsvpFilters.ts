import { useMemo, useState } from "react";
import type { EventDetail, EventRsvp } from "@/types";
import type { RsvpFilter } from "./RsvpFilterTabs";

export function useRsvpFilters(rsvps: EventRsvp[], event: EventDetail) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RsvpFilter>("all");

  const counts = useMemo(
    () => ({
      all: rsvps.length,
      member: rsvps.filter((r) => r.isMember).length,
      new: rsvps.filter((r) => !r.isMember).length,
    }),
    [rsvps],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rsvps.filter((r) => {
      const matchQ = !q || r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const matchFilter =
        filter === "all" || (filter === "member" && r.isMember) || (filter === "new" && !r.isMember);
      return matchQ && matchFilter;
    });
  }, [rsvps, search, filter]);

  function exportCsv() {
    if (rsvps.length === 0) return;
    const head = ["Name", "Email", "Phone", "Attendees", "Status", "Date"];
    const rows = rsvps.map((r) => [
      r.fullName,
      r.email,
      r.phone ?? "",
      String(r.attendees),
      r.isMember ? "Member" : "New",
      new Date(r.createdAt).toLocaleString("en-GB"),
    ]);
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [head, ...rows].map((row) => row.map(esc).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvps-${event.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return { search, setSearch, filter, setFilter, counts, filtered, exportCsv };
}
