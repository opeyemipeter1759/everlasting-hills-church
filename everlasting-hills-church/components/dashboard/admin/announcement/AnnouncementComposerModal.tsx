import { useEffect, useState } from "react";
import { Check, FileText, Loader2, Mail, Send } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import FileUpload from "@/components/ui/form/FileUpload";
import { EMPTY_FORM } from "./types";
import type { Announcement, AnnouncementFormValues } from "./types";

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#87102C]/40 focus:ring-2 focus:ring-[#87102C]/10 transition-all";

export default function AnnouncementComposerModal({
  open,
  editingItem,
  onClose,
  onCreate,
  onUpdate,
  creating,
  updating,
}: {
  open: boolean;
  editingItem: Announcement | null;
  onClose: () => void;
  onCreate: (values: AnnouncementFormValues, status: "DRAFT" | "PUBLISHED") => void;
  onUpdate: (values: AnnouncementFormValues) => void;
  creating: boolean;
  updating: boolean;
}) {
  const [values, setValues] = useState<AnnouncementFormValues>(EMPTY_FORM);
  const isEditing = !!editingItem;
  const busy = creating || updating;

  useEffect(() => {
    if (!open) return;
    setValues(
      editingItem
        ? {
            title: editingItem.title,
            body: editingItem.body,
            imageUrl: editingItem.imageUrl ?? "",
            sendEmail: editingItem.sendEmail,
          }
        : EMPTY_FORM,
    );
  }, [open, editingItem]);

  function set<K extends keyof AnnouncementFormValues>(key: K, value: AnnouncementFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const canSubmit = values.title.trim().length >= 3 && values.body.trim().length >= 3;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Announcement" : "New Announcement"}
      description={
        isEditing
          ? "Editing won't re-notify members who already saw this."
          : "Save as a draft to review later, or publish to notify everyone now."
      }
      maxWidth="lg"
    >
      <div className="space-y-4">
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Title"
          maxLength={140}
          className={inputCls}
        />
        <textarea
          value={values.body}
          onChange={(e) => set("body", e.target.value)}
          placeholder="Write your message to the church family..."
          rows={5}
          maxLength={4000}
          className={`${inputCls} resize-y`}
        />

        <FileUpload
          type="image"
          endpoint="/uploads/image"
          value={values.imageUrl}
          onChange={(url) => set("imageUrl", url)}
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={values.sendEmail}
            onChange={(e) => set("sendEmail", e.target.checked)}
            className="rounded border-gray-300 text-[#87102C] focus:ring-[#87102C]"
          />
          <Mail size={14} className={values.sendEmail ? "text-[#87102C]" : "text-gray-400"} />
          <span className={values.sendEmail ? "text-[#87102C] font-medium" : "text-gray-400 dark:text-white/40"}>
            {values.sendEmail ? "Also email members" : "Skip email"}
          </span>
        </label>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          {isEditing ? (
            <button
              onClick={() => onUpdate(values)}
              disabled={!canSubmit || busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#6E0C24] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {updating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save Changes
            </button>
          ) : (
            <>
              <button
                onClick={() => onCreate(values, "DRAFT")}
                disabled={!canSubmit || busy}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FileText size={15} /> Save Draft
              </button>
              <button
                onClick={() => onCreate(values, "PUBLISHED")}
                disabled={!canSubmit || busy}
                className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#6E0C24] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Publish Now
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
