"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { blockLabel, type Block } from "./cms-blocks";
import MediaPickerModal from "./MediaPickerModal";

const inp =
  "w-full text-sm rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400";

export default function BlockEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  // Narrowed patch helper (each branch below only patches keys valid for its type).
  const patch = (p: Partial<Block>) => onChange({ ...block, ...p } as Block);

  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
          <GripVertical size={13} className="text-gray-300 dark:text-white/20" />
          {blockLabel(block.type)}
        </span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-1.5 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 disabled:opacity-30" aria-label="Move up"><ChevronUp size={15} /></button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="p-1.5 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 disabled:opacity-30" aria-label="Move down"><ChevronDown size={15} /></button>
          <button type="button" onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" aria-label="Delete block"><Trash2 size={15} /></button>
        </div>
      </div>

      {block.type === "heading" && (
        <div className="space-y-2">
          <div className="inline-flex rounded-lg border border-[#E7CDD3] dark:border-white/10 overflow-hidden text-xs font-bold">
            {([2, 3] as const).map((lvl) => (
              <button key={lvl} type="button" onClick={() => patch({ level: lvl })}
                className={`px-3 py-1.5 ${block.level === lvl ? "bg-[#87102C] text-white" : "text-gray-500 dark:text-white/50"}`}>H{lvl}</button>
            ))}
          </div>
          <input className={inp} value={block.text} onChange={(e) => patch({ text: e.target.value })} placeholder="Heading text" />
        </div>
      )}

      {block.type === "paragraph" && (
        <textarea className={`${inp} min-h-[100px]`} value={block.text} onChange={(e) => patch({ text: e.target.value })} placeholder="Write a paragraph…" />
      )}

      {block.type === "image" && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {block.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.url} alt={block.alt} className="h-20 w-20 rounded-xl object-cover border border-[#E7CDD3]" />
            ) : (
              <div className="h-20 w-20 rounded-xl border border-dashed border-[#E7CDD3] flex items-center justify-center text-[10px] text-gray-400 text-center">No image</div>
            )}
            <button type="button" onClick={() => setPickerOpen(true)} className="px-3.5 py-2 rounded-xl border border-[#E7CDD3] dark:border-white/10 text-sm font-semibold text-[#87102C] dark:text-[#e8768a] hover:bg-[#FFF4F6] dark:hover:bg-white/5">
              {block.url ? "Change image" : "Choose image"}
            </button>
          </div>
          <input className={inp} value={block.alt} onChange={(e) => patch({ alt: e.target.value })} placeholder="Alt text (required for accessibility)" />
          <input className={inp} value={block.caption ?? ""} onChange={(e) => patch({ caption: e.target.value })} placeholder="Caption (optional)" />
          <MediaPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={(a) => patch({ mediaId: a.id, url: a.url, alt: block.alt || a.alt })}
          />
        </div>
      )}

      {block.type === "quote" && (
        <div className="space-y-2">
          <textarea className={`${inp} min-h-[80px]`} value={block.text} onChange={(e) => patch({ text: e.target.value })} placeholder="Quote text" />
          <input className={inp} value={block.cite ?? ""} onChange={(e) => patch({ cite: e.target.value })} placeholder="Attribution (optional)" />
        </div>
      )}

      {block.type === "list" && (
        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-white/50">
            <input type="checkbox" checked={block.ordered} onChange={(e) => patch({ ordered: e.target.checked })} className="accent-[#87102C]" />
            Numbered list
          </label>
          <textarea
            className={`${inp} min-h-[100px]`}
            value={block.items.join("\n")}
            onChange={(e) => patch({ items: e.target.value.split("\n") })}
            placeholder="One item per line"
          />
        </div>
      )}

      {block.type === "divider" && (
        <p className="text-sm text-gray-400">A horizontal divider.</p>
      )}

      {block.type === "video" && (
        <input className={inp} value={block.url} onChange={(e) => patch({ url: e.target.value })} placeholder="YouTube / Vimeo URL" />
      )}

      {block.type === "cta" && (
        <div className="grid sm:grid-cols-2 gap-2">
          <input className={inp} value={block.label} onChange={(e) => patch({ label: e.target.value })} placeholder="Button label" />
          <input className={inp} value={block.href} onChange={(e) => patch({ href: e.target.value })} placeholder="Link (/give or https://…)" />
        </div>
      )}

      {block.type === "featuredSermon" && (
        <input className={inp} value={block.sermonId ?? ""} onChange={(e) => patch({ sermonId: e.target.value || null })} placeholder="Sermon ID" />
      )}

      {block.type === "featuredEvent" && (
        <input className={inp} value={block.eventId ?? ""} onChange={(e) => patch({ eventId: e.target.value || null })} placeholder="Event ID" />
      )}
    </div>
  );
}
