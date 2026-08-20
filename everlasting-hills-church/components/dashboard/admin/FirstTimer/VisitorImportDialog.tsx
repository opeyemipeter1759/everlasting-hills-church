"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, FileSpreadsheet } from "lucide-react";
import { apiClient } from "@/lib/api/axios";

interface VisitorImportRow {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  gender?: string;
  howDidYouLearn?: string;
  invitedBy?: string;
  locatedInIbadan?: boolean;
  membershipInterest?: string;
  address?: string;
  birthDay?: number;
  birthMonth?: number;
  occupation?: string;
  bornAgain?: string;
  serviceExperience?: string;
  prayerPoint?: string;
  whatsappInterest?: boolean;
  submittedAt?: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: number;
  results: { name: string; status: string; reason?: string }[];
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

/** Lowercase, strip everything but letters/digits — makes matching Google Forms'
 * long/punctuated headers ("How did you learn about EHC ?") robust to wording and
 * encoding quirks (mangled smart-quote bytes just fall out of the a-z0-9 filter). */
function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findCol(norm: string[], test: (h: string) => boolean): number {
  return norm.findIndex(test);
}

function parseYesNo(raw?: string): boolean | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "yes") return true;
  if (v === "no") return false;
  return undefined; // "Maybe" etc. — left unset rather than guessed
}

/** "2/4" (month/day, no year — this form never collects one) → {birthMonth, birthDay}. */
function parseBirthMD(raw: string): { birthDay?: number; birthMonth?: number } {
  const m = raw.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!m) return {};
  const month = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return {};
  return { birthMonth: month, birthDay: day };
}

function cell(cells: string[], i: number): string | undefined {
  return i >= 0 ? (cells[i] ?? "").trim() || undefined : undefined;
}

function rowsToVisitors(grid: string[][]): { rows: VisitorImportRow[]; error?: string } {
  if (grid.length < 2) return { rows: [], error: "Need a header row plus at least one data row" };
  const norm = grid[0].map(normalizeHeader);

  const tsi = findCol(norm, (h) => h === "timestamp");
  const fi = findCol(norm, (h) => h.includes("firstname"));
  const li = findCol(norm, (h) => h.includes("lastname") || h.includes("surname"));
  const pi = findCol(norm, (h) => h.includes("phone"));
  const ei = findCol(norm, (h) => h.includes("email"));
  const gi = findCol(norm, (h) => h === "gender" || h.includes("gender"));
  const hi = findCol(norm, (h) => h.includes("howdidyoulearn") || h.includes("learnaboutehc"));
  const ivi = findCol(norm, (h) => h.includes("nameoffriend") || h.includes("friendfamily"));
  const ribi = findCol(norm, (h) => h.includes("resideinibadan") || (h.includes("reside") && h.includes("ibadan")));
  const gwi = findCol(norm, (h) => h.includes("growwithus") || (h.includes("grow") && h.includes("withus")));
  const addi = findCol(norm, (h) => h.includes("address"));
  const dobi = findCol(norm, (h) => h.includes("dateofbirth") || h === "dob");
  const occi = findCol(norm, (h) => h.includes("whatdoyoudo") || h.includes("occupation"));
  const bai = findCol(norm, (h) => h.includes("bornagain"));
  const sei = findCol(norm, (h) => h.includes("enjoyabouttheservice") || (h.includes("enjoy") && h.includes("service")));
  const ppi = findCol(norm, (h) => h.includes("prayerpoint") || h.includes("prayer"));
  const wii = findCol(norm, (h) => h.includes("whatsapp") && h.includes("interested"));

  if (fi < 0 || li < 0) {
    return { rows: [], error: "CSV must have First Name and Last Name columns" };
  }

  const rows: VisitorImportRow[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    const firstName = cell(cells, fi) ?? "";
    const lastName = cell(cells, li) ?? "";
    if (!firstName && !lastName) continue;

    let submittedAt: string | undefined;
    const rawTs = cell(cells, tsi);
    if (rawTs) {
      const d = new Date(rawTs);
      if (!isNaN(d.getTime())) submittedAt = d.toISOString();
    }

    rows.push({
      firstName,
      lastName,
      phone: cell(cells, pi),
      email: cell(cells, ei),
      gender: cell(cells, gi),
      howDidYouLearn: cell(cells, hi),
      invitedBy: cell(cells, ivi),
      locatedInIbadan: parseYesNo(cell(cells, ribi)),
      membershipInterest: cell(cells, gwi),
      address: cell(cells, addi),
      ...(dobi >= 0 ? parseBirthMD(cells[dobi] ?? "") : {}),
      occupation: cell(cells, occi),
      bornAgain: cell(cells, bai),
      serviceExperience: cell(cells, sei),
      prayerPoint: cell(cells, ppi),
      whatsappInterest: parseYesNo(cell(cells, wii)),
      submittedAt,
    });
  }
  return { rows };
}

export default function VisitorImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sendWelcome, setSendWelcome] = useState(true);
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
    const { rows, error: parseErr } = rowsToVisitors(parseCsv(text));
    if (parseErr) return setError(parseErr);
    if (rows.length === 0) return setError("No data rows found");
    setBusy(true);
    try {
      const res = await apiClient.post<ImportResult>("/visitors/import", { rows, sendWelcome });
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
    setSendWelcome(true);
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
                Import First Timers
              </h3>
              <button onClick={() => !busy && reset()} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>

            {!result ? (
              <>
                <p className="text-xs text-gray-500 dark:text-white/50 mb-3">
                  Upload a first-timer response export (e.g. a Google Forms CSV). Columns are matched by
                  name automatically — <code>First Name</code> and <code>Last Name</code> are required;
                  everything else (phone, email, gender, how they heard about us, address, date of birth,
                  prayer points, etc.) is picked up if present.
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
                  placeholder={"Timestamp,First Name,Last Name,Phone Number,Email,...\n5/11/2026 1:38:02,Jane,Doe,08012345678,jane@example.com,..."}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-xs font-mono text-gray-900 dark:text-white focus:outline-none focus:border-[#87102C]/40"
                />
                <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWelcome}
                    onChange={(e) => setSendWelcome(e.target.checked)}
                    className="rounded border-gray-300 text-[#87102C] focus:ring-[#87102C]"
                  />
                  Send each first-timer a welcome email
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
                          <span className="font-mono">{r.name}</span> — {r.status}
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
