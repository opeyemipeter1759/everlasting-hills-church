import { Mail } from "lucide-react";
import EmailTemplateCard from "./EmailTemplateCard";
import type { EmailTemplate } from "@/lib/api/emails";

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-5 space-y-3"
        >
          <div className="h-4 w-1/3 rounded bg-gray-100 dark:bg-white/10" />
          <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 py-14 text-center">
      <Mail size={28} className="mx-auto text-gray-200 dark:text-white/10 mb-3" />
      <p className="text-sm text-gray-400 dark:text-white/40">No templates yet — click New to write one.</p>
    </div>
  );
}

export default function EmailTemplateList({
  items,
  isLoading,
  onSend,
  onDelete,
}: {
  items: EmailTemplate[];
  isLoading: boolean;
  onSend: (t: EmailTemplate) => void;
  onDelete: (t: EmailTemplate) => void;
}) {
  if (isLoading) return <Skeleton />;
  if (items.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
      {items.map((t) => (
        <EmailTemplateCard key={t.id} t={t} onSend={() => onSend(t)} onDelete={() => onDelete(t)} />
      ))}
    </div>
  );
}
