import type { PipelineStatus } from "@/lib/api/pipeline";
import { STATUS_META } from "./status";

/** A first-timer's status, labelled, in its own colour. */
export function StatusChip({ status }: { status: PipelineStatus }) {
  const { label, chip } = STATUS_META[status];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${chip}`}>
      {label}
    </span>
  );
}
