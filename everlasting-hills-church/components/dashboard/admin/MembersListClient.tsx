"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, Phone, Trash2, Users } from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export interface MemberRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  joinedAt: string;
  status?: string;
  photoUrl?: string | null;
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
                </Link>

                <div className="flex items-center gap-3 flex-shrink-0">
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
