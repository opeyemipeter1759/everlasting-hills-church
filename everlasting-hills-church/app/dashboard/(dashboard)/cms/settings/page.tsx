"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Save, Trash2 } from "lucide-react";
import {
  useSiteConfig,
  useUpdateSiteConfig,
  type SiteIdentity,
} from "@/lib/api/cms";

const field =
  "w-full text-sm rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-white/30";

export default function CmsSiteSettings() {
  const { data, isLoading } = useSiteConfig();
  const update = useUpdateSiteConfig();
  const [form, setForm] = useState<SiteIdentity | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.content && !form) setForm(data.content);
  }, [data, form]);

  if (isLoading || !form) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  function set<K extends keyof SiteIdentity>(key: K, value: SiteIdentity[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setDirty(true);
    setSaved(false);
  }
  function setSocial(key: keyof SiteIdentity["socials"], value: string) {
    setForm((f) => (f ? { ...f, socials: { ...f.socials, [key]: value } } : f));
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    if (!form) return;
    setError(null);
    try {
      await update.mutateAsync(form);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const e = err as { message?: string; details?: { path: string; message: string }[] };
      setError(e.details?.map((d) => `${d.path}: ${d.message}`).join(" · ") ?? e.message ?? "Save failed");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Church identity" help="Shown across the whole site.">
        <Labeled label="Church name">
          <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Labeled>
        <div className="grid sm:grid-cols-2 gap-4">
          <Labeled label="Logo URL" help="From the media library or /public.">
            <input className={field} value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="/logo.png" />
          </Labeled>
          <Labeled label="Favicon URL">
            <input className={field} value={form.faviconUrl} onChange={(e) => set("faviconUrl", e.target.value)} placeholder="/favicon.ico" />
          </Labeled>
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid sm:grid-cols-2 gap-4">
          <Labeled label="Contact email">
            <input className={field} value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Labeled>
          <Labeled label="Contact phone">
            <input className={field} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </Labeled>
        </div>
        <Labeled label="Address">
          <input className={field} value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Labeled>
        <Labeled label="Google Maps embed URL" help="The src of the Maps iframe embed.">
          <input className={field} value={form.mapsEmbedUrl} onChange={(e) => set("mapsEmbedUrl", e.target.value)} placeholder="https://www.google.com/maps/embed?..." />
        </Labeled>
      </Section>

      <Section title="Social links" help="Leave blank to hide a channel.">
        <div className="grid sm:grid-cols-2 gap-4">
          {(["instagram", "youtube", "facebook", "x", "tiktok", "whatsapp"] as const).map((k) => (
            <Labeled key={k} label={k === "x" ? "X (Twitter)" : k.charAt(0).toUpperCase() + k.slice(1)}>
              <input className={field} value={form.socials[k]} onChange={(e) => setSocial(k, e.target.value)} placeholder="https://…" />
            </Labeled>
          ))}
        </div>
      </Section>

      <Section title="Footer">
        <Labeled label="Footer tagline">
          <input className={field} value={form.footerTagline} onChange={(e) => set("footerTagline", e.target.value)} />
        </Labeled>
        <Labeled label="Legal links">
          <div className="space-y-2">
            {form.legalLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={`${field} flex-1`}
                  value={link.label}
                  onChange={(e) => set("legalLinks", form.legalLinks.map((l, idx) => (idx === i ? { ...l, label: e.target.value } : l)))}
                  placeholder="Label"
                />
                <input
                  className={`${field} flex-1`}
                  value={link.href}
                  onChange={(e) => set("legalLinks", form.legalLinks.map((l, idx) => (idx === i ? { ...l, href: e.target.value } : l)))}
                  placeholder="/privacy"
                />
                <button
                  type="button"
                  onClick={() => set("legalLinks", form.legalLinks.filter((_, idx) => idx !== i))}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  aria-label="Remove link"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {form.legalLinks.length < 10 && (
              <button
                type="button"
                onClick={() => set("legalLinks", [...form.legalLinks, { label: "", href: "" }])}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline"
              >
                <Plus size={14} /> Add legal link
              </button>
            )}
          </div>
        </Labeled>
      </Section>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
      )}

      {/* Sticky save bar */}
      <div className="sticky bottom-4 flex items-center justify-end gap-3">
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <Check size={15} /> Saved
          </span>
        )}
        <button
          type="button"
          disabled={!dirty || update.isPending}
          onClick={save}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#87102C] text-white text-sm font-bold shadow-lg shadow-black/10 hover:bg-[#6E0C24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save size={16} /> {update.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, help, children }: { title: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
        {help && <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{help}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Labeled({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">
        {label}
        {help && <span className="ml-2 font-normal text-gray-400 dark:text-white/30">{help}</span>}
      </label>
      {children}
    </div>
  );
}
