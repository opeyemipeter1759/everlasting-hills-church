import { AlertTriangle } from "lucide-react";
import StructuredForm from "@/components/dashboard/admin/cms/structured/StructuredForm";
import TestimonialsCmsClient from "@/components/dashboard/pastor/Testimonial/TestimonialsCmsClient";
import type { SiteSectionName } from "@/lib/site-settings";
import { SITE_SETTINGS_FIELDS } from "./site-settings-fields";

export interface FieldIssue {
  path: string;
  message: string;
}

interface Props {
  active: SiteSectionName;
  draft: unknown;
  fieldIssues: FieldIssue[];
  serverError: string | null;
  onChange: (value: unknown) => void;
}

export default function SiteSettingsFormPanel({
  active,
  draft,
  fieldIssues,
  serverError,
  onChange,
}: Props) {
  return (
    <div className="min-w-0 flex-1 space-y-4">
      {fieldIssues.length > 0 && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">
                {fieldIssues.length} validation issue{fieldIssues.length === 1 ? "" : "s"}
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs">
                {fieldIssues.map((issue, index) => (
                  <li key={index}>
                    <code className="rounded bg-red-100 px-1 py-0.5 font-mono text-[11px]">
                      {issue.path || "(root)"}
                    </code>{" "}
                    — {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {serverError && fieldIssues.length === 0 && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <StructuredForm fields={SITE_SETTINGS_FIELDS[active]} value={draft} onChange={onChange} />

      {active === "TESTIMONIALS" && (
        <div className="mt-2 border-t border-[#E7CDD3] pt-6">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
            Testimonial stories — add, edit, and publish which stories appear
          </p>
          <TestimonialsCmsClient />
        </div>
      )}
    </div>
  );
}
