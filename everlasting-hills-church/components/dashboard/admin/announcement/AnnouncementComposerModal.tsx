"use client";

import { useEffect, useState } from "react";
import { Check, Clock, FileText, Loader2, Mail, MapPin, Send, Sparkles, Users, X } from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import FileUpload from "@/components/ui/form/FileUpload";
import type { PersonRole } from "@/lib/api/people";
import { ROLE_LABEL } from "../people/peopleShared/roleMeta";
import { SpecificPeoplePicker } from "./SpecificPeoplePicker";
import { EMPTY_FORM } from "./types";
import type { Announcement, AnnouncementFormValues, TargetGender } from "./types";

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#87102C]/40 focus:ring-2 focus:ring-[#87102C]/10 transition-all";

const ROLE_OPTIONS = Object.keys(ROLE_LABEL) as PersonRole[];
const GENDER_OPTIONS: { value: TargetGender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

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

  // AI drafting state
  const [aiIdea, setAiIdea] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (!open) { setAiOpen(false); setAiIdea(""); setAiError(""); return; }
    setValues(
      editingItem
        ? {
            title: editingItem.title,
            body: editingItem.body,
            imageUrl: editingItem.imageUrl ?? "",
            sendEmail: editingItem.sendEmail,
            targetRoles: editingItem.targetRoles,
            targetGenders: editingItem.targetGenders,
            targetPeople: editingItem.targetProfileIds.map((id, i) => ({ id, name: editingItem.targetProfileNames[i] ?? "Unknown" })),
            eventTime: editingItem.eventTime ?? "",
            venue: editingItem.venue ?? "",
          }
        : EMPTY_FORM,
    );
  }, [open, editingItem]);

  function set<K extends keyof AnnouncementFormValues>(key: K, value: AnnouncementFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleRole(role: PersonRole) {
    set("targetRoles", values.targetRoles.includes(role) ? values.targetRoles.filter((r) => r !== role) : [...values.targetRoles, role]);
  }

  function toggleGender(gender: TargetGender) {
    set("targetGenders", values.targetGenders.includes(gender) ? values.targetGenders.filter((g) => g !== gender) : [...values.targetGenders, gender]);
  }

  const hasTargeting = values.targetRoles.length > 0 || values.targetGenders.length > 0 || values.targetPeople.length > 0;

  async function draftWithAI() {
    if (!aiIdea.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: aiIdea }),
      });
      const json = await res.json();
      if (json.title || json.body) {
        set("title", json.title ?? values.title);
        set("body", json.body ?? values.body);
        setAiOpen(false);
        setAiIdea("");
      } else {
        setAiError("Gemini couldn't generate a draft. Try rephrasing your idea.");
      }
    } catch {
      setAiError("Something went wrong. Check your connection and try again.");
    } finally {
      setAiLoading(false);
    }
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

        {/* AI Draft panel */}
        {!isEditing && (
          <div>
            {!aiOpen ? (
              <button
                type="button"
                onClick={() => setAiOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-200 dark:border-violet-500/25 bg-violet-50 dark:bg-violet-500/[0.08] px-4 py-2.5 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/15 transition-colors"
              >
                <Sparkles size={15} />
                Draft with Gemini AI
              </button>
            ) : (
              <div className="rounded-2xl border border-violet-200 dark:border-violet-500/25 bg-violet-50/60 dark:bg-violet-500/[0.06] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-semibold text-violet-800 dark:text-violet-200">
                    <Sparkles size={14} /> Describe your announcement idea
                  </p>
                  <button type="button" onClick={() => { setAiOpen(false); setAiError(""); }} className="text-violet-400 hover:text-violet-600 dark:hover:text-violet-200">
                    <X size={16} />
                  </button>
                </div>
                <textarea
                  value={aiIdea}
                  onChange={(e) => setAiIdea(e.target.value)}
                  placeholder="e.g. Sunday's service is about Daniel's faith, we're also doing a baby dedication, dress code is white..."
                  rows={3}
                  className="w-full rounded-xl border border-violet-200 dark:border-violet-500/20 bg-white dark:bg-white/[0.05] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-violet-300 dark:placeholder-white/25 focus:outline-none focus:border-violet-400 dark:focus:border-violet-500/50 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/20 resize-none transition-all"
                />
                {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                <button
                  type="button"
                  onClick={draftWithAI}
                  disabled={!aiIdea.trim() || aiLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {aiLoading ? "Drafting…" : "Generate Draft"}
                </button>
                <p className="text-[11px] text-violet-400 dark:text-violet-500">
                  Gemini will write a complete announcement. You can edit it before publishing.
                </p>
              </div>
            )}
          </div>
        )}

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

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Clock size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="time"
              value={values.eventTime}
              onChange={(e) => set("eventTime", e.target.value)}
              className={`${inputCls} pl-10`}
            />
          </div>
          <div className="relative">
            <MapPin size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={values.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Venue"
              maxLength={140}
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

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

        {/* Email audience — everyone always sees the announcement in-app; this
            only narrows who additionally gets emailed. */}
        {values.sendEmail && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 space-y-3.5">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-700 dark:text-white/80">Who should receive the email?</p>
            {!hasTargeting && (
              <span className="ml-auto text-[11px] font-medium text-gray-400">Everyone (default)</span>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Roles</p>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    values.targetRoles.includes(role)
                      ? "border-[#87102C]/40 bg-[#87102C] text-white"
                      : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {ROLE_LABEL[role]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Gender</p>
            <div className="flex flex-wrap gap-1.5">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => toggleGender(g.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    values.targetGenders.includes(g.value)
                      ? "border-[#87102C]/40 bg-[#87102C] text-white"
                      : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">Specific people</p>
            <SpecificPeoplePicker selected={values.targetPeople} onChange={(people) => set("targetPeople", people)} />
          </div>

          {hasTargeting && (
            <p className="text-[11px] text-gray-400">
              Emails anyone matching any of the above — leave everything blank to email everyone instead.
              The announcement itself still shows to everyone on their dashboard either way.
            </p>
          )}
        </div>
        )}

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
