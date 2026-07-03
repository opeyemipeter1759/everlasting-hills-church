"use client";

import { useState } from "react";
import { X } from "lucide-react";
import SubmitButton from "@/components/ui/form/SubmitButton";

interface CreateUnitFormProps {
  onCancel: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}

export default function CreateUnitForm({ onCancel, onCreate }: CreateUnitFormProps) {
  const [data, setData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onCreate(data.name.trim(), data.description.trim());
    } catch (err) {
      setError((err as Error).message ?? "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">New unit</h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-700 p-1" aria-label="Close">
          <X size={16} />
        </button>
      </div>

      <input
        required
        type="text"
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        placeholder="Unit name (e.g. Hospitality)"
        maxLength={80}
        className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
      />
      <input
        type="text"
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        placeholder="Description (optional)"
        maxLength={400}
        className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1.5">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <SubmitButton loading={saving} disabled={!data.name.trim()}>
          {saving ? "Creating…" : "Create unit"}
        </SubmitButton>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}