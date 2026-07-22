import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { ReportRow } from "@/lib/api/status-reports";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Inline marks (bold/italic/underline) on a text node, walking up from it to
 * the block element the HTML→docx walker is currently building runs for. */
function runsFor(node: ChildNode, marks: { bold?: boolean; italics?: boolean; underline?: boolean } = {}): TextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    if (!text) return [];
    return [new TextRun({ text, bold: marks.bold, italics: marks.italics, underline: marks.underline ? {} : undefined })];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const nextMarks = {
    bold: marks.bold || tag === "strong" || tag === "b",
    italics: marks.italics || tag === "em" || tag === "i",
    underline: marks.underline || tag === "u",
  };
  if (tag === "br") return [new TextRun({ text: "", break: 1 })];
  return Array.from(el.childNodes).flatMap((child) => runsFor(child, nextMarks));
}

/** Converts the report's stored HTML (from ReportEditor) into docx paragraphs —
 * headings, plain paragraphs, bulleted/numbered list items, and blockquotes,
 * each carrying inline bold/italic/underline runs. Good enough fidelity for a
 * status report; not a general-purpose HTML→docx converter. */
function blocksToDocx(html: string): Paragraph[] {
  const container = document.createElement("div");
  container.innerHTML = html;
  const paragraphs: Paragraph[] = [];

  function pushList(listEl: HTMLElement, ordered: boolean) {
    Array.from(listEl.children).forEach((li) => {
      const runs = Array.from(li.childNodes).flatMap((n) => runsFor(n));
      paragraphs.push(
        new Paragraph({
          children: runs.length ? runs : [new TextRun("")],
          bullet: ordered ? undefined : { level: 0 },
          numbering: ordered ? { reference: "report-numbering", level: 0 } : undefined,
        }),
      );
    });
  }

  Array.from(container.children).forEach((block) => {
    const tag = block.tagName.toLowerCase();
    if (tag === "h2" || tag === "h3") {
      const runs = Array.from(block.childNodes).flatMap((n) => runsFor(n));
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs }));
    } else if (tag === "ul") {
      pushList(block as HTMLElement, false);
    } else if (tag === "ol") {
      pushList(block as HTMLElement, true);
    } else if (tag === "blockquote") {
      const runs = Array.from(block.childNodes).flatMap((n) => runsFor(n, { italics: true }));
      paragraphs.push(new Paragraph({ indent: { left: 480 }, children: runs }));
    } else if (tag === "hr") {
      paragraphs.push(new Paragraph({ text: "" }));
    } else {
      const runs = Array.from(block.childNodes).flatMap((n) => runsFor(n));
      paragraphs.push(new Paragraph({ children: runs.length ? runs : [new TextRun("")], spacing: { after: 160 } }));
    }
  });

  return paragraphs.length ? paragraphs : [new Paragraph({ text: "" })];
}

/** Builds a real .docx from a report and triggers a browser download —
 * client-side only, no backend round trip. */
export async function exportReportDocx(report: ReportRow): Promise<void> {
  const doc = new Document({
    numbering: {
      config: [{ reference: "report-numbering", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }] }],
    },
    sections: [
      {
        children: [
          new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(report.title)] }),
          new Paragraph({
            spacing: { after: 300 },
            children: [
              new TextRun({ text: `${report.status.replace("_", " ")} · ${fmt(report.createdAt)}`, color: "888888", size: 20 }),
            ],
          }),
          ...blocksToDocx(report.content),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.title.replace(/[^\w\s-]/g, "").trim() || "report"}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
