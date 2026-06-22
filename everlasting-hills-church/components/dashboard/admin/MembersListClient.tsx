"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Phone, Trash2, Users, Tag, X } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";

export interface MemberRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  joinedAt: string;
  status?: string;
  photoUrl?: string | null;
  tags?: string[];
}

interface Props {
  initialMembers: MemberRow[];
  searchQuery?: string;
}

function fmtJoinedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

/**
 * Member directory with delete action.
 *
 * Delete animation = "smoke dissipation". The row visibly drifts apart instead of
 * snapping away:
 *   • blur ramps 0 → 22px      (vapour spreading)
 *   • scale expands 1 → 1.15   (smoke billowing out)
 *   • y drifts -14px           (rising)
 *   • opacity fades 1 → 0
 *   • saturation 1 → 0         (loses colour as it dissipates)
 * Then the slot height collapses to 0 so the list below glides up to fill the gap.
 *
 * Tuned with an easeOut curve so the wisp decelerates as it disperses — smoke
 * moves fast at first then slows, matching that physical intuition.
 */
export default function MembersListClient({ initialMembers, searchQuery }: Props) {
  const [members, setMembers] = useState<MemberRow[]>(initialMembers);
  const [pending, setPending] = useState<MemberRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tag editing
  const [tagTarget, setTagTarget] = useState<MemberRow | null>(null);
  const [tagValue, setTagValue] = useState("");
  const [tagSaving, setTagSaving] = useState(false);

  function openTagEditor(m: MemberRow) {
    setTagTarget(m);
    setTagValue((m.tags ?? []).join(", "));
  }

  async function saveTags() {
    if (!tagTarget) return;
    setTagSaving(true);
    const tags = tagValue
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    try {
      const res = await apiClient.patch<{ id: string; tags: string[] }>(
        `/members/${tagTarget.id}/tags`,
        { tags },
      );
      const saved = res.data?.tags ?? tags;
      setMembers((prev) =>
        prev.map((m) => (m.id === tagTarget.id ? { ...m, tags: saved } : m)),
      );
      setTagTarget(null);
    } finally {
      setTagSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pending) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/members/${pending.id}`);
      const removedId = pending.id;
      // Close the dialog and pull the row out of the array — AnimatePresence
      // catches the unmount and runs the exit animation before removing the node.
      setPending(null);
      setMembers((prev) => prev.filter((m) => m.id !== removedId));
    } catch (err) {
      setError((err as { message?: string }).message ?? "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  if (members.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
        <Users size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          No members found
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {searchQuery
            ? "Try a different search term"
            : "Convert your first visitor from the First Timers page"}
        </p>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        open={pending !== null}
        title="Permanently delete this member?"
        description={
          <span>
            <strong className="text-gray-900 dark:text-white">
              {pending?.firstName} {pending?.lastName}
            </strong>{" "}
            and all their records (attendance, notes, follow-ups, sermon bookmarks) will be
            permanently removed. Their sign-in account is also deleted. This cannot be undone.
            {error && (
              <span className="block mt-2 text-red-600 dark:text-red-400 text-xs">{error}</span>
            )}
          </span>
        }
        confirmLabel="Yes, delete permanently"
        tone="danger"
        loading={loading}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!loading) {
            setPending(null);
            setError(null);
          }
        }}
      />

      {/* Tag editor */}
      {tagTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !tagSaving && setTagTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Tags · {tagTarget.firstName} {tagTarget.lastName}
              </h3>
              <button
                onClick={() => !tagSaving && setTagTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <input
              autoFocus
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveTags()}
              placeholder="comma-separated, e.g. choir, youth, first-timer"
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#87102C]/40"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setTagTarget(null)}
                disabled={tagSaving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={saveTags}
                disabled={tagSaving}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-50"
              >
                {tagSaving ? "Saving..." : "Save tags"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <ul className="divide-y divide-gray-100 dark:divide-white/8">
          <AnimatePresence initial={false}>
            {members.map((m) => (
              <motion.li
                key={m.id}
                layout
                initial={false}
                exit={{
                  opacity: 0,
                  scale: 1.15,
                  y: -14,
                  filter: "blur(22px) saturate(0)",
                  height: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                  marginTop: 0,
                  marginBottom: 0,
                }}
                transition={{
                  // The wisp (blur + scale + drift + fade + desaturate) happens first
                  // and overshoots a touch — this is what carries the smoke feel.
                  // The collapse of the row slot follows so the rows below glide up
                  // only after the smoke has visually dispersed.
                  opacity: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                  filter: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  scale: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
                  y: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
                  height: { delay: 0.4, duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                  paddingTop: { delay: 0.4, duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                  paddingBottom: { delay: 0.4, duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                  marginTop: { delay: 0.4, duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                  marginBottom: { delay: 0.4, duration: 0.32, ease: [0.4, 0, 0.2, 1] },
                  layout: { delay: 0.4, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                }}
                style={{ transformOrigin: "left center" }}
                className="flex items-center gap-4 px-5 py-4 overflow-hidden hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group will-change-[filter,transform,opacity]"
              >
                {m.photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={m.photoUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center text-sm font-bold text-[#87102C] dark:text-[#e8768a] flex-shrink-0">
                    {initials(m.firstName, m.lastName)}
                  </div>
                )}

                <Link
                  href={`/dashboard/members/${m.id}`}
                  className="flex-1 min-w-0 group/link"
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover/link:text-[#87102C] dark:group-hover/link:text-[#e8768a] transition-colors">
                    {m.firstName} {m.lastName}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex-wrap">
                    {m.email && (
                      <span className="inline-flex items-center gap-1 min-w-0 truncate">
                        <Mail size={11} className="flex-shrink-0" />
                        <span className="truncate">{m.email}</span>
                      </span>
                    )}
                    {m.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone size={11} />
                        {m.phone}
                      </span>
                    )}
                  </div>
                  {m.tags && m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#87102C]/10 text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openTagEditor(m)}
                    title="Edit tags"
                    className="p-2 rounded-lg text-gray-400 hover:text-[#87102C] hover:bg-[#87102C]/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <Tag size={14} />
                  </button>
                  <div className="text-right">
                    {m.status && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {m.status}
                      </span>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      Joined {fmtJoinedDate(m.joinedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setPending(m);
                    }}
                    title="Delete member"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </>
  );
}
