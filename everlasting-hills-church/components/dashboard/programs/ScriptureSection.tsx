"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ApiError } from "@/lib/api/axios";
import { checkScripture, useBibleBooks } from "@/lib/api/programs-admin";
import type { ProgramDraft } from "./useProgramDraft";
import { card, hint, input, label, secondary, sectionTitle } from "./ui";

/**
 * The scriptures, checked against the church's Bible before they are added:
 * pick the book from the list, type the chapter and verses, and see the text.
 * A scripture marked "needs confirmation" is flagged on the programs list.
 */
export function ScriptureSection({ draft }: { draft: ProgramDraft }) {
  const books = useBibleBooks();
  const [ref, setRef] = useState("");
  const [found, setFound] = useState<{ reference: string; text: string | null; translation: string | null } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const { scriptures, setScriptures } = draft;

  const check = async () => {
    setProblem(null);
    setFound(null);
    try {
      setFound(await checkScripture(ref.trim()));
    } catch (e) {
      setProblem((e as ApiError).message || "That reference could not be checked.");
    }
  };
  const add = () => {
    if (!found) return;
    setScriptures([...scriptures, { reference: found.reference, status: "CONFIRMED" }]);
    setRef("");
    setFound(null);
  };

  return (
    <section id="scripture" className={`${card} space-y-4`} aria-labelledby="scripture-title">
      <h2 id="scripture-title" className={sectionTitle}>Scripture</h2>
      {scriptures.length === 0 && <p className="text-sm text-gray-600 dark:text-white/60">No scripture yet. A program can go without one.</p>}
      <ul className="space-y-2">
        {scriptures.map((s, i) => (
          <li key={`${s.reference}-${i}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 px-3 py-2 dark:border-white/10">
            <span className="flex-1 font-medium text-[#111] dark:text-white">{s.reference}</span>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-white/75">
              <input type="checkbox" className="h-4 w-4 accent-[#87102C]" checked={s.status === "SUGGESTED"} onChange={(e) => setScriptures(scriptures.map((x, j) => (j === i ? { ...x, status: e.target.checked ? "SUGGESTED" : "CONFIRMED" } : x)))} />
              Needs confirmation
            </label>
            <button type="button" className={secondary} aria-label={`Remove ${s.reference}`} onClick={() => setScriptures(scriptures.filter((_, j) => j !== i))}>
              <X size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div>
        <label className={label} htmlFor="scripture-ref">Add a scripture</label>
        <div className="mt-1 flex flex-wrap gap-2">
          <input id="scripture-ref" list="bible-books" className={`${input} max-w-xs flex-1`} placeholder="Isaiah 62:6-7" value={ref} onChange={(e) => { setRef(e.target.value); setFound(null); }} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), check())} />
          <datalist id="bible-books">
            {(books.data ?? []).map((b) => (
              <option key={b.id} value={`${b.name} `} />
            ))}
          </datalist>
          <button type="button" className={secondary} onClick={check} disabled={ref.trim().length < 3}>
            Check
          </button>
        </div>
        <p className={hint}>Book, chapter and verses, like Luke 24:49 or Deuteronomy 33:13.</p>
        {problem && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{problem}</p>}
        {found && (
          <div className="mt-3 rounded-xl bg-gray-50 p-3 dark:bg-white/5">
            <p className="text-sm text-[#111] dark:text-white/85">{found.text}</p>
            <p className="mt-1 text-xs text-gray-600 dark:text-white/55">
              {found.reference}
              {found.translation ? `, ${found.translation}` : ""}
            </p>
            <button type="button" className={`${secondary} mt-3`} onClick={add}>
              Add {found.reference}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
