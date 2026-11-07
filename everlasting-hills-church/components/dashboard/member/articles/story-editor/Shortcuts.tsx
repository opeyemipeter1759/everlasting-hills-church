import { X } from "lucide-react";
import { Kbd } from "./ToolButton";

/** The formatting cheat sheet behind "Formatting help". */
export function Shortcuts({ mod, onClose }: { mod: string; onClose: () => void }) {
  const rows: [string, string, string][] = [
    ["Bold", `${mod}+B`, "**text**"],
    ["Italic", `${mod}+I`, "*text*"],
    ["Link", `${mod}+K`, "[text](https://…)"],
    ["Inline code", `${mod}+E`, "`text`"],
    ["Heading", `${mod}+Alt+2`, "## "],
    ["Subheading", `${mod}+Alt+3`, "#### "],
    ["Bulleted list", `${mod}+Shift+8`, "- "],
    ["Numbered list", `${mod}+Shift+7`, "1. "],
    ["Quote", `${mod}+Shift+B`, "> "],
    ["Divider line", "", "---"],
  ];
  return (
    <div className="m-paper mt-3 overflow-hidden rounded-xl border m-rule font-sans text-[13px]">
      <div className="flex items-center justify-between border-b m-rule px-4 py-2.5">
        <p className="m-ink font-semibold">Formatting help</p>
        <button type="button" onClick={onClose} aria-label="Close formatting help" className="m-muted rounded-md p-1 hover:text-[var(--m-ink)]">
          <X size={15} aria-hidden="true" />
        </button>
      </div>
      <p className="m-muted px-4 pt-3 text-[12px]">
        Use the toolbar, a keyboard shortcut, or type the Markdown at the start of a line: it turns into formatting as you type.
      </p>
      <table className="mt-2 w-full">
        <thead className="sr-only">
          <tr>
            <th>Format</th>
            <th>Shortcut</th>
            <th>Markdown</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, keys, md]) => (
            <tr key={name} className="border-t m-rule first:border-t-0">
              <td className="m-ink px-4 py-2">{name}</td>
              <td className="m-muted px-2 py-2">{keys && <Kbd>{keys}</Kbd>}</td>
              <td className="px-4 py-2 text-right">
                <code className="m-muted rounded bg-[var(--m-brand-soft)] px-1.5 py-0.5 font-mono text-[12px]">{md}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
