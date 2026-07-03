"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Check, Eye, History, Plus, Rocket, Save, Undo2,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import {
  mintPreviewToken, useCmsPage, useCmsVersions, usePublishPage,
  useRestoreVersion, useSaveDraft, useUnpublishPage,
} from "@/lib/api/cms";
import { BLOCK_MENU, createBlock, type Block, type BlockType } from "./cms-blocks";
import BlockEditor from "./BlockEditor";
import BlockRenderer from "./BlockRenderer";
import StructuredEditor from "./structured/StructuredEditor";

export default function PageEditor({ pageKey }: { pageKey: string }) {
  const { data, isLoading, error } = useCmsPage(pageKey);
  const saveDraft = useSaveDraft(pageKey);
  const publish = usePublishPage(pageKey);
  const unpublish = useUnpublishPage(pageKey);
  const restore = useRestoreVersion(pageKey);
  const versionsQ = useCmsVersions(pageKey);

  const [content, setContent] = useState<unknown>(null);
  const [dirty, setDirty] = useState(false);
  const [seededVersion, setSeededVersion] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    const v = data.working.version;
    if (seededVersion === v) return;
    setContent(data.working.content ?? {});
    setSeededVersion(v);
    setDirty(false);
  }, [data, seededVersion]);

  if (error) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{(error as { message?: string }).message ?? "Failed to load"}</div>;
  }
  if (isLoading || !data || content === null) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}</div>;
  }

  const isStructured = data.def.editor === "structured";
  const highImpact = data.def.highImpact;
  const blocks: Block[] = Array.isArray((content as { blocks?: Block[] })?.blocks)
    ? (content as { blocks: Block[] }).blocks
    : [];

  function update(next: unknown) { setContent(next); setDirty(true); setSaved(false); }
  function updateBlocks(next: Block[]) { update({ blocks: next }); }
  function addBlock(type: BlockType) { updateBlocks([...blocks, createBlock(type)]); setAddOpen(false); }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    updateBlocks(next);
  }

  async function doSave() {
    await saveDraft.mutateAsync({ content });
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }
  async function doPublish() {
    if (dirty) await saveDraft.mutateAsync({ content });
    await publish.mutateAsync();
    setConfirmPublish(false);
    setDirty(false);
  }
  const route = data.def.route;
  async function doPreview() {
    if (dirty) await doSave();
    const { token } = await mintPreviewToken(pageKey);
    // Structured pages render draft in their bespoke public layout via ?preview=;
    // block pages use the generic /preview renderer.
    const url = isStructured
      ? `${route}?preview=${encodeURIComponent(token)}`
      : `/preview?token=${encodeURIComponent(token)}`;
    window.open(url, "_blank");
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/cms" className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5" aria-label="Back"><ArrowLeft size={18} /></Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{data.page.title}</h1>
            <p className="text-xs text-gray-400 dark:text-white/40 font-mono">{data.def.route}</p>
          </div>
          {data.page.published ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published</span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Draft</span>
          )}
          {dirty && <span className="text-[10px] font-semibold text-gray-400">Unsaved</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {saved && <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400"><Check size={14} /> Saved</span>}
          {!isStructured && <button type="button" onClick={() => setShowPreview((v) => !v)} className={tbBtn}><Eye size={15} /> {showPreview ? "Editing" : "Preview"}</button>}
          <button type="button" onClick={doPreview} className={tbBtn}><Eye size={15} /> Live preview</button>
          <button type="button" onClick={() => setShowHistory((v) => !v)} className={tbBtn}><History size={15} /> History</button>
          <button type="button" onClick={doSave} disabled={!dirty || saveDraft.isPending} className={tbBtn}><Save size={15} /> {saveDraft.isPending ? "Saving…" : "Save draft"}</button>
          {data.page.published && (
            <button type="button" onClick={() => unpublish.mutate()} disabled={unpublish.isPending} className={tbBtn}><Undo2 size={15} /> Unpublish</button>
          )}
          <button type="button" onClick={() => (highImpact ? setConfirmPublish(true) : doPublish())} disabled={publish.isPending} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#87102C] text-white text-sm font-bold hover:bg-[#6E0C24] disabled:opacity-50">
            <Rocket size={15} /> {publish.isPending ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {isStructured ? (
            <StructuredEditor contentType={data.def.contentType ?? ""} content={content} onChange={update} />
          ) : showPreview ? (
            <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-6 sm:p-8">
              <BlockRenderer blocks={blocks} />
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((b, i) => (
                <BlockEditor
                  key={b.id}
                  block={b}
                  onChange={(nb) => updateBlocks(blocks.map((x, idx) => (idx === i ? nb : x)))}
                  onDelete={() => updateBlocks(blocks.filter((_, idx) => idx !== i))}
                  onMoveUp={() => move(i, -1)}
                  onMoveDown={() => move(i, 1)}
                  isFirst={i === 0}
                  isLast={i === blocks.length - 1}
                />
              ))}
              <div className="relative">
                <button type="button" onClick={() => setAddOpen((v) => !v)} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#E7CDD3] dark:border-white/15 text-sm font-semibold text-[#87102C] dark:text-[#e8768a] hover:bg-[#FFF4F6] dark:hover:bg-white/5">
                  <Plus size={16} /> Add block
                </button>
                {addOpen && (
                  <div className="absolute z-20 mt-2 left-1/2 -translate-x-1/2 w-64 rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] shadow-xl p-2 grid grid-cols-2 gap-1">
                    {BLOCK_MENU.map((m) => (
                      <button key={m.type} type="button" onClick={() => addBlock(m.type)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-white/70 hover:bg-[#FFF4F6] dark:hover:bg-white/5 text-left">
                        <m.icon size={14} className="text-[#87102C] dark:text-[#e8768a]" /> {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {showHistory && (
          <aside className="w-72 flex-shrink-0">
            <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-3">Version history</p>
              {versionsQ.data?.versions.length ? (
                <ul className="space-y-1.5">
                  {versionsQ.data.versions.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-2 rounded-xl border border-[#E7CDD3]/40 dark:border-white/[0.06] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">v{v.version}{v.isLive && <span className="ml-1.5 text-[9px] font-bold uppercase text-emerald-600">live</span>}</p>
                        <p className="text-[10px] text-gray-400">{new Date(v.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!v.isLive && (
                        <button type="button" onClick={() => restore.mutate(v.version)} disabled={restore.isPending} className="text-[11px] font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline disabled:opacity-50">Restore</button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-400">No versions yet. Publish to create one.</p>
              )}
            </div>
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={confirmPublish}
        title={`Publish ${data.page.title}?`}
        description="This is a high-impact page. Publishing makes your changes live on the public site immediately."
        confirmLabel="Yes, publish"
        tone="warning"
        loading={publish.isPending || saveDraft.isPending}
        onConfirm={doPublish}
        onCancel={() => { if (!publish.isPending) setConfirmPublish(false); }}
      />
    </div>
  );
}

const tbBtn =
  "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-sm font-semibold text-gray-700 dark:text-white/70 hover:bg-[#FFF4F6] dark:hover:bg-white/10 transition-colors disabled:opacity-50";
