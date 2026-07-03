"use client";

import StructuredForm from "./StructuredForm";
import { structuredFields } from "./structured-fields";

/**
 * Renders the field-driven form for a structured page's content type. Designed
 * pages keep their bespoke public layout; only their specific fields are editable.
 */
export default function StructuredEditor({
  contentType,
  content,
  onChange,
}: {
  contentType: string;
  content: unknown;
  onChange: (c: unknown) => void;
}) {
  const fields = structuredFields(contentType);
  if (!fields) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E7CDD3] p-8 text-center text-sm text-gray-400">
        No structured editor is registered for &quot;{contentType}&quot;.
      </div>
    );
  }
  return <StructuredForm fields={fields} value={content} onChange={onChange} />;
}
