"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, Plus, Trash2, Lightbulb } from "lucide-react";
import { Select } from "@/components/ui/select";

type SermonFormData = {
  id?: string;
  title: string;
  speaker: string;
  date: string;
  description: string;
  transcript: string;
  scriptureRef: string;
  series: string;
  tags: string;
  audioUrl: string;
  audioKey: string;
  audioDuration: number | null;
  videoUrl: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  scheduledFor: string;
  isFeatured: boolean;
};

const EMPTY: SermonFormData = {
  title: "", speaker: "", date: new Date().toISOString().split("T")[0],
  description: "", transcript: "", scriptureRef: "", series: "", tags: "",
  audioUrl: "", audioKey: "", audioDuration: null, videoUrl: "",
  status: "DRAFT", scheduledFor: "", isFeatured: false,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600";

type Question = { id: string; question: string; order: number };

export default function SermonForm({
  initial,
  discussionQuestions = [],
}: {
  initial?: Partial<SermonFormData>;
  discussionQuestions?: Question[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<SermonFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>(discussionQuestions);
  const [newQuestion, setNewQuestion] = useState("");
  const [addingQ, setAddingQ] = useState(false);
  const [deletingQ, setDeletingQ] = useState<string | null>(null);

  function set(key: keyof SermonFormData, val: unknown) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      // /sermons/upload-audio expects multipart/form-data — let axios set the boundary header.
      const { apiClient } = await import("@/lib/api/axios");
      const res = await apiClient.post<{ audioUrl: string; audioKey: string }>(
        "/sermons/upload-audio",
        fd,
        { headers: { "Content-Type": undefined as unknown as string } },
      );
      set("audioUrl", res.data.audioUrl);
      set("audioKey", res.data.audioKey);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function addQuestion() {
    if (!newQuestion.trim() || !form.id) return;
    setAddingQ(true);
    try {
      const res = await fetch(`/api/sermons/${form.id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setQuestions((prev) => [...prev, json.data]);
        setNewQuestion("");
      }
    } finally { setAddingQ(false); }
  }

  async function deleteQuestion(questionId: string) {
    if (!form.id) return;
    setDeletingQ(questionId);
    try {
      const res = await fetch(`/api/sermons/${form.id}/questions/${questionId}`, { method: "DELETE" });
      if (res.ok) setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } finally { setDeletingQ(null); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        speaker: form.speaker,
        date: form.date,
        description: form.description || undefined,
        transcript: form.transcript || undefined,
        scriptureRef: form.scriptureRef || undefined,
        series: form.series || undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        audioUrl: form.audioUrl || undefined,
        audioKey: form.audioKey || undefined,
        audioDuration: form.audioDuration ?? undefined,
        videoUrl: form.videoUrl || undefined,
        status: form.status,
        scheduledFor: form.status === "SCHEDULED" && form.scheduledFor ? form.scheduledFor : undefined,
        isFeatured: form.isFeatured,
      };

      const { apiClient } = await import("@/lib/api/axios");
      if (form.id) {
        await apiClient.patch(`/sermons/admin/${form.id}`, payload);
      } else {
        await apiClient.post("/sermons/admin", payload);
      }
      router.push("/dashboard/sermons");
      router.refresh();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Title *">
          <input required value={form.title} onChange={(e) => set("title", e.target.value)}
            placeholder="Sermon title" className={inputCls} />
        </Field>
        <Field label="Speaker *">
          <input required value={form.speaker} onChange={(e) => set("speaker", e.target.value)}
            placeholder="Speaker name" className={inputCls} />
        </Field>
        <Field label="Date *">
          <input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
            className={inputCls} />
        </Field>
        <Field label="Scripture Reference">
          <input value={form.scriptureRef} onChange={(e) => set("scriptureRef", e.target.value)}
            placeholder="e.g. John 3:16" className={inputCls} />
        </Field>
        <Field label="Series">
          <input value={form.series} onChange={(e) => set("series", e.target.value)}
            placeholder="e.g. Book of Romans" className={inputCls} />
        </Field>
        <Field label="Tags (comma-separated)">
          <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
            placeholder="faith, prayer, grace" className={inputCls} />
        </Field>
      </div>

      <Field label="Description">
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
          rows={3} placeholder="Brief sermon description…"
          className={`${inputCls} resize-none`} />
      </Field>

      {/* Audio Upload */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Audio File</label>
        {form.audioUrl ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Audio uploaded</p>
              <audio controls src={form.audioUrl} className="mt-1 w-full h-8" />
            </div>
            <button type="button" onClick={() => { set("audioUrl", ""); set("audioKey", ""); }}
              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
              <X size={16} />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[#87102C]/40 transition-colors cursor-pointer">
            {uploading ? <Loader2 size={18} className="text-[#87102C] animate-spin" /> : <Upload size={18} className="text-gray-400" />}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {uploading ? "Uploading…" : "Click to upload audio (MP3, WAV, AAC — max 100 MB)"}
            </span>
            <input type="file" accept="audio/*" className="sr-only" onChange={handleAudioUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <Field label="Video URL (YouTube / Vimeo embed)">
        <input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)}
          placeholder="https://www.youtube.com/embed/..." className={inputCls} />
      </Field>

      <Field label="Transcript / Notes">
        <textarea value={form.transcript} onChange={(e) => set("transcript", e.target.value)}
          rows={6} placeholder="Full sermon transcript or notes…"
          className={`${inputCls} resize-y`} />
      </Field>

      {/* Status + Publish */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Status">
          <Select
            aria-label="Status"
            value={form.status}
            onChange={(v) => set("status", v)}
            className={inputCls}
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
              { value: "SCHEDULED", label: "Scheduled" },
            ]}
          />
        </Field>
        {form.status === "SCHEDULED" && (
          <Field label="Publish At">
            <input type="datetime-local" value={form.scheduledFor}
              onChange={(e) => set("scheduledFor", e.target.value)} className={inputCls} />
          </Field>
        )}
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)}
          className="w-4 h-4 rounded accent-[#87102C]" />
        <span className="text-sm text-gray-700 dark:text-gray-300">Feature this sermon on the homepage</span>
      </label>

      {/* Discussion Questions (edit mode only) */}
      {form.id && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Reflection / Discussion Questions</span>
          </div>

          {questions.length > 0 && (
            <ul className="space-y-2">
              {questions.map((q, i) => (
                <li key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <span className="w-5 h-5 rounded-full bg-[#87102C]/10 text-[#87102C] text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300">{q.question}</p>
                  <button type="button" onClick={() => deleteQuestion(q.id)}
                    disabled={deletingQ === q.id}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50">
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2">
            <input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addQuestion(); } }}
              placeholder="Add a reflection question…"
              className={`${inputCls} flex-1`}
            />
            <button type="button" onClick={addQuestion} disabled={addingQ || !newQuestion.trim()}
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-all whitespace-nowrap">
              {addingQ ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Add
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/8">
        <button type="submit" disabled={saving}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50 transition-all">
          {saving ? "Saving…" : form.id ? "Save Changes" : "Create Sermon"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}
