"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, FileSpreadsheet } from "lucide-react";
import { apiClient } from "@/lib/api/axios";

interface ImportRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags?: string[];
  household?: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
  results: { email: string; status: string; reason?: string }[];
}

/** Minimal CSV parser: handles quoted fields and commas/newlines inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (field !== "" || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function rowsToMembers(grid: string[][]): { rows: ImportRow[]; error?: string } {
  if (grid.length < 2) return { rows: [], error: "Need a header row plus at least one data row" };
  const header = grid[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const idx = (names: string[]) => header.findIndex((h) => names.includes(h));
  const fi = idx(["firstname", "first"]);
  const li = idx(["lastname", "last", "surname"]);
  const ei = idx(["email"]);
  const pi = idx(["phone", "phonenumber"]);
  const ti = idx(["tags"]);
  const hi = idx(["household", "family"]);
  if (fi < 0 || li < 0 || ei < 0 || pi < 0) {
    return { rows: [], error: "CSV must have columns: firstName, lastName, email, phone" };
  }
  const rows: ImportRow[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    const email = (cells[ei] ?? "").trim();
    if (!email) continue;
    rows.push({
      firstName: (cells[fi] ?? "").trim(),
      lastName: (cells[li] ?? "").trim(),
      email,
      phone: (cells[pi] ?? "").trim(),
      tags:
        ti >= 0 && cells[ti]
          ? cells[ti].split(/[;|]/).map((t) => t.trim().toLowerCase()).filter(Boolean)
          : undefined,
      household: hi >= 0 && cells[hi] ? cells[hi].trim() : undefined,
    });
  }
  return { rows };
}

export default function MemberImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sendWelcome, setSendWelcome] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setText);
  }

  async function runImport() {
    setError(null);
    setResult(null);
    const { rows, error: parseErr } = rowsToMembers(parseCsv(text));
    if (parseErr) return setError(parseErr);
    if (rows.length === 0) return setError("No data rows found");
    setBusy(true);
    try {
      const res = await apiClient.post<ImportResult>("/members/import", { rows, sendWelcome });
      setResult(res.data);
      router.refresh();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
          ?.error?.message ?? "Import failed",
      );
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setOpen(false);
    setText("");
    setResult(null);
    setError(null);
    setSendWelcome(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
      >
        <Upload size={14} />
        Import CSV
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !busy && reset()}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-[#87102C] dark:text-[#e8768a]" />
                Import Members
              </h3>
              <button onClick={() => !busy && reset()} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            {!result ? (
              <>
                <p className="text-xs text-gray-500 dark:text-white/50 mb-3">
                  CSV columns: <code>firstName, lastName, email, phone</code> (required),
                  optional <code>tags</code> (use ; between tags) and <code>household</code>.
                  Phone is the member&apos;s initial password.
                </p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onFile}
                  className="block w-full text-xs text-gray-500 mb-3 file:mr-3 file:rounded-lg file:border-0 file:bg-[#87102C] file:px-3 file:py-2 file:text-white file:text-xs file:font-semibold"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  placeholder={"firstName,lastName,email,phone,tags,household\nJane,Doe,jane@example.com,+2348012345678,choir;youth,Doe Family"}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#87102C]/40"
                />
                <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWelcome}
                    onChange={(e) => setSendWelcome(e.target.checked)}
                    className="rounded border-gray-300 text-[#87102C] focus:ring-[#87102C]"
                  />
                  Send each member a welcome email with their login details
                </label>
                {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={reset} disabled={busy} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5">
                    Cancel
                  </button>
                  <button
                    onClick={runImport}
                    disabled={busy || !text.trim()}
                    className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50"
                  >
                    {busy ? "Importing..." : "Import"}
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.created}</p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50">Created</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3 text-center">
                    <p className="text-2xl font-bold text-gray-600 dark:text-white/70">{result.skipped}</p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50">Skipped</p>
                  </div>
                  <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{result.errors}</p>
                    <p className="text-[11px] text-gray-500 dark:text-white/50">Errors</p>
                  </div>
                </div>
                {result.results.some((r) => r.status !== "created") && (
                  <div className="max-h-40 overflow-y-auto text-xs space-y-1 mb-4">
                    {result.results
                      .filter((r) => r.status !== "created")
                      .map((r, i) => (
                        <p key={i} className="text-gray-500 dark:text-white/50">
                          <span className="font-mono">{r.email}</span> — {r.status}
                          {r.reason ? `: ${r.reason}` : ""}
                        </p>
                      ))}
                  </div>
                )}
                <div className="flex justify-end">
                  <button onClick={reset} className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#87102C] text-white hover:bg-[#6E0C24]">
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
