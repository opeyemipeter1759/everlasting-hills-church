"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2, MessageCircle, Share2 } from "lucide-react";
import { shareUrl, useUpdateHostSettings, type HostDetail } from "@/lib/api/one-on-one";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { Section, btnGhost, btnPrimary, input, muted } from "./ui";

/** Each pastor's own booking link, ready to post under a sermon, in a WhatsApp group, or anywhere online. */
export default function ShareCard({ host }: { host: HostDetail }) {
  const update = useUpdateHostSettings(host.id);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState(host.slug ?? "");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setSlug(host.slug ?? ""), [host.slug]);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), []);

  if (!host.slug) return null;
  const url = shareUrl(host.slug);
  const message = `Would you like to talk and pray with ${host.displayName}? Request a one-on-one session here: ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error("Couldn't copy. Select the link and copy it instead.");
    }
  }

  async function share() {
    try {
      await navigator.share({ title: `One-on-One with ${host.displayName}`, text: message, url });
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  }

  async function saveSlug(e: React.FormEvent) {
    e.preventDefault();
    try {
      await update.mutateAsync({ slug });
      setEditing(false);
      showToast.success("Link updated. Old copies of the link will stop working.");
    } catch (err) {
      showToast.error(errorText(err, "Couldn't change the link."));
    }
  }

  return (
    <Section icon={Link2} eyebrow="Share" title="Your booking link">
      <p className={`mb-3 text-sm ${muted}`}>
        Anyone with this link can request a session with {host.displayName}: visitors who find the messages online, and members, who are taken to their dashboard.
        {!host.visitorsAllowed && " Visitors can’t request time right now; switch it on under booking rules."}
      </p>

      {editing ? (
        <form onSubmit={saveSlug} className="flex flex-col gap-2">
          <label htmlFor="host-slug" className="text-xs font-semibold text-[#5A4A4D] dark:text-white/60">
            everlastinghills.church/talk-to-a-pastor/
          </label>
          <input
            id="host-slug"
            className={input}
            value={slug}
            minLength={3}
            maxLength={60}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Lowercase letters, numbers and dashes"
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary} disabled={update.isPending || slug === host.slug}>
              Save link
            </button>
            <button type="button" className={btnGhost} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-xl border border-[#E7CDD3] bg-[#FDF3F5]/60 py-1 pl-3.5 pr-1 dark:border-white/10 dark:bg-white/[0.04]">
            <span className="min-w-0 flex-1 select-all truncate text-sm font-semibold text-[#111] dark:text-white">{url}</span>
            <button type="button" onClick={copy} className={`${btnPrimary} px-3 py-1.5 text-xs`} aria-live="polite">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={btnGhost}>
              <MessageCircle size={14} /> WhatsApp
            </a>
            {canShare && (
              <button type="button" onClick={share} className={btnGhost}>
                <Share2 size={14} /> Share
              </button>
            )}
            <button type="button" onClick={() => setEditing(true)} className={btnGhost}>
              Change link
            </button>
          </div>
        </>
      )}
    </Section>
  );
}
