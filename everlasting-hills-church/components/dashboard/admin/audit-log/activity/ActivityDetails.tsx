import { Lock } from "lucide-react";
import type { AuditItem, AuditRecord } from "@/lib/api/audit-trail";
import { fieldsOf, whenText } from "@/lib/audit/format";
import { FieldList } from "./FieldList";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-xs font-bold text-[#87102C] dark:text-[#e8768a]">{title}</h4>
      {children}
    </section>
  );
}

function RecordChange({ record }: { record: AuditRecord }) {
  const hasBefore = fieldsOf(record.before).length > 0 || (record.before !== null && typeof record.before !== "object");
  const hasAfter = fieldsOf(record.after).length > 0 || (record.after !== null && typeof record.after !== "object");
  return (
    <div className="space-y-3 rounded-xl border border-gray-200 p-3 dark:border-white/10">
      <p className="text-xs text-gray-500 dark:text-white/45">
        {record.action.toLowerCase().replace(/_/g, " ")} · {record.entity} · {whenText(record.at)}
      </p>
      {hasBefore && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-600 dark:text-white/60">Before</p>
          <FieldList value={record.before} />
        </div>
      )}
      {hasAfter && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-600 dark:text-white/60">After</p>
          <FieldList value={record.after} />
        </div>
      )}
      {!hasBefore && !hasAfter && <p className="text-sm text-gray-500 dark:text-white/45">No details were kept for this record.</p>}
    </div>
  );
}

/** Everything kept about one action: what was sent and how the records changed. */
export function ActivityDetails({ item }: { item: AuditItem }) {
  const sent = fieldsOf(item.body).length > 0 || (item.body !== null && typeof item.body !== "object");
  return (
    <div className="space-y-5 border-t border-gray-100 px-4 py-4 dark:border-white/[0.06]">
      {item.bodyHidden && (
        <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
          <Lock size={14} aria-hidden="true" /> A private message or note: who and when are kept, the words are not.
        </p>
      )}
      {sent && (
        <Section title="What they entered">
          <FieldList value={item.body} />
        </Section>
      )}
      {item.records.length > 0 && (
        <Section title={item.kind === "record" ? "The record" : "What changed on record"}>
          <div className="space-y-3">
            {item.records.map((r) => (
              <RecordChange key={r.id} record={r} />
            ))}
          </div>
        </Section>
      )}
      {!item.bodyHidden && !sent && item.records.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-white/45">Nothing else was entered for this action.</p>
      )}
    </div>
  );
}
