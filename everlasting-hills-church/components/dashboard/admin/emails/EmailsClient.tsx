"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import {
  useEmailTemplates,
  useDeleteEmailTemplate,
  useEmailsSent,
  usePreviewRecipients,
  useSendEmail,
} from "@/lib/api/emails";
import type { EmailTemplate } from "@/lib/api/emails";
import EmailTemplateList from "./EmailTemplateList";
import SentHistoryList from "./SentHistoryList";
import SendEmailModal from "./SendEmailModal";

export default function EmailsClient() {
  const [tab, setTab] = useState<"TEMPLATES" | "SENT">("TEMPLATES");
  const [sentPage, setSentPage] = useState(1);
  const [sendTarget, setSendTarget] = useState<EmailTemplate | "BLANK" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);

  const { data: templates = [], isLoading: templatesLoading } = useEmailTemplates();
  const { data: sentResponse, isLoading: sentLoading } = useEmailsSent(sentPage, 5, tab === "SENT");
  const sent = sentResponse?.data ?? [];
  const deleteMutation = useDeleteEmailTemplate();
  const previewMutation = usePreviewRecipients();
  const sendMutation = useSendEmail();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Emails</h1>
          <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">
            Save reusable email templates and send them to members, a unit, a role, or hand-picked people.
          </p>
        </div>
        <Link
          href="/dashboard/admin/emails/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6E0C24] transition-colors"
        >
          <Plus size={16} /> New Template
        </Link>
      </div>

      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-white/10">
        {(["TEMPLATES", "SENT"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              if (t === "SENT") setSentPage(1);
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-[#87102C] text-[#87102C] dark:text-[#e8768a]"
                : "border-transparent text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/70"
            }`}
          >
            {t === "TEMPLATES" ? "Templates" : "Sent"}
          </button>
        ))}
      </div>

      {tab === "TEMPLATES" ? (
        <EmailTemplateList
          items={templates}
          isLoading={templatesLoading}
          onSend={(t) => setSendTarget(t)}
          onDelete={setDeleteTarget}
        />
      ) : (
        <SentHistoryList
          items={sent}
          isLoading={sentLoading}
          page={sentResponse?.meta.page ?? sentPage}
          pageCount={sentResponse?.meta.totalPages ?? 1}
          onPageChange={setSentPage}
        />
      )}

      <SendEmailModal
        open={!!sendTarget}
        target={sendTarget}
        onClose={() => setSendTarget(null)}
        onSend={(args) => sendMutation.mutate(args)}
        sending={sendMutation.isPending}
        preview={previewMutation.data}
        onPreview={(audience) => previewMutation.mutate(audience)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        tone="danger"
        title="Delete template?"
        description={
          <>
            This permanently removes <span className="font-semibold">{deleteTarget?.name}</span>. Past sends made
            from it are unaffected. This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
