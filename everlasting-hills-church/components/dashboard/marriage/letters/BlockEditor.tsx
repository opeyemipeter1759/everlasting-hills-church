"use client";

import { useState } from "react";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { previewLetter, type Block, type LetterTemplate } from "@/lib/api/marriage-documents";
import { PageHeader, card, input, primary, secondary, useRun } from "../ui";

const NAMES: Record<string, string> = {
  refLine: "Reference line",
  title: "Title",
  subtitle: "Subtitle",
  heading: "Heading",
  paragraph: "Paragraph",
  note: "Note (small print)",
  lines: "Lines (one per line)",
  list: "List (one item per line)",
  testList: "The screening tests",
  labList: "The recommended laboratories",
  signatureColumns: "Signature blocks",
};
const PLACEHOLDERS = "{applicationRef} {issueDate} {groomName} {brideName} {applicationDate} {validFromDate} {returnInstructions}";

/** Editing one letter's words, block by block. The layout stays the renderer's; **bold** and the placeholders work in any text. */
export function BlockEditor({ template, onDone }: { template: LetterTemplate; onDone: () => void }) {
  const [blocks, setBlocks] = useState<Block[]>(() => structuredClone(template.body));
  const { run, pending } = useRun();
  const set = (i: number, patch: Partial<Block>) => setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const area = (i: number, key: string, value: string, rows = 3) => (
    <textarea aria-label={`${NAMES[blocks[i].type]} ${key}`} rows={rows} value={value} onChange={(e) => set(i, { [key]: e.target.value })} className={`${input} mt-1 py-2`} />
  );
  const linesArea = (i: number, key: "lines" | "items") => (
    <textarea aria-label={NAMES[blocks[i].type]} rows={4} value={((blocks[i][key] as string[]) ?? []).join("\n")} onChange={(e) => set(i, { [key]: e.target.value.split("\n") })} className={`${input} mt-1 py-2`} />
  );

  async function preview() {
    try {
      await previewLetter(template.kind, blocks);
    } catch (e) {
      showToast.error((e as ApiError).message || "The preview could not be made. Check the wording for unknown placeholders.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6">
      <PageHeader title={`Editing version ${template.version}`} subtitle={`Saving makes a new draft version. Placeholders: ${PLACEHOLDERS}`} />
      {blocks.map((b, i) => (
        <fieldset key={i} className={card}>
          <legend className="sr-only">{NAMES[b.type]}</legend>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#111] dark:text-white/90">{NAMES[b.type] ?? b.type}</p>
            {(b.type === "paragraph" || b.type === "note") && (
              <button type="button" className={secondary} onClick={() => setBlocks(blocks.filter((_, j) => j !== i))}>
                Remove
              </button>
            )}
          </div>
          {"text" in b && area(i, "text", b.text as string, b.type === "paragraph" || b.type === "note" ? 4 : 1)}
          {b.type === "refLine" && (
            <>
              {area(i, "left", b.left as string, 1)}
              {area(i, "right", b.right as string, 1)}
            </>
          )}
          {b.type === "lines" && linesArea(i, "lines")}
          {b.type === "list" && linesArea(i, "items")}
          {(b.type === "testList" || b.type === "labList") && <p className="mt-1 text-xs text-gray-600 dark:text-white/55">Filled in from the documents settings.</p>}
          {b.type === "signatureColumns" && <p className="mt-1 text-xs text-gray-600 dark:text-white/55">The two signature blocks, side by side. Their wording is fixed in this version.</p>}
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondary} onClick={() => setBlocks([...blocks, { type: "paragraph", text: "New paragraph" }])}>
          Add a paragraph
        </button>
        <button type="button" className={secondary} onClick={preview}>
          Preview on the letterhead
        </button>
        <button type="button" className={primary} disabled={pending} onClick={async () => (await run("post", `/premarital/document-templates/${template.kind}`, { blocks }, "Saved as a new draft version")) && onDone()}>
          Save as a new version
        </button>
        <button type="button" className={secondary} onClick={onDone}>
          Cancel
        </button>
      </div>
    </div>
  );
}
