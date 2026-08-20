"use client";

import { useEffect, useState } from "react";
import { Cake, PartyPopper, Send, Loader2, MessageCircleHeart, Sparkles } from "lucide-react";
import { Avatar, timeAgo } from "../../../sermons/watch/chatUi";
import { ConfettiFall } from "@/components/ui/motion/ConfettiFall";
import { showToast } from "@/components/ui/toast/toast";
import {
  useBirthdayGreetings,
  useAddBirthdayGreeting,
} from "@/lib/api/birthday-greetings";
import { card, hdrBdr, iconCl, kicker, cardTitle, muted } from "./tokens";
import type { MemberHomeProps } from "./types";

type CommunityBirthday = NonNullable<MemberHomeProps["communityBirthdays"]>[number];

// Rotates through a few festive accent colors so a wall of wishes doesn't look monotone.
const ACCENTS = ["#FFC93C", "#FF6FA5", "#7CE3D8", "#B491FF"];

function daysUntilLabel(daysUntil: number) {
  if (daysUntil === 0) return "Today 🎂";
  if (daysUntil === 1) return "Tomorrow";
  return `In ${daysUntil}d`;
}

/** Scattered confetti dots for texture — pure CSS, no images/deps. */
function ConfettiOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.15]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #FFD84D 2.5px, transparent 2.5px)," +
          "radial-gradient(circle, #FF9ECF 2px, transparent 2px)," +
          "radial-gradient(circle, #8FE9DD 2px, transparent 2px)",
        backgroundSize: "42px 42px, 34px 34px, 28px 28px",
        backgroundPosition: "0 0, 12px 20px, 26px 6px",
      }}
    />
  );
}

const WISH_PAGE_SIZE = 2;
const WISH_ROTATE_MS = 5000;

/** My own birthday wall — read-only list of wishes people have left me. Only ever
 * shows WISH_PAGE_SIZE at a time, auto-rotating through the rest like a carousel
 * instead of dumping every wish into a long scroll. */
function MyBirthdayWall({ memberId }: { memberId: string }) {
  const { data: greetings, isLoading } = useBirthdayGreetings(memberId);
  const [page, setPage] = useState(0);
  const pageCount = greetings ? Math.ceil(greetings.length / WISH_PAGE_SIZE) : 0;

  useEffect(() => {
    if (pageCount <= 1) return;
    const id = setInterval(() => {
      setPage((p) => (p + 1) % pageCount);
    }, WISH_ROTATE_MS);
    return () => clearInterval(id);
  }, [pageCount]);

  const visible = greetings?.slice(page * WISH_PAGE_SIZE, page * WISH_PAGE_SIZE + WISH_PAGE_SIZE) ?? [];

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(155deg, #3a0512 0%, #6a0d24 30%, #9c1433 60%, #c73a5a 100%)" }}
    >
      <ConfettiOverlay />
      <ConfettiFall className="opacity-70" />
      <div aria-hidden="true" className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "4s" }} />
      <div aria-hidden="true" className="absolute -bottom-24 -left-14 h-64 w-64 rounded-full bg-fuchsia-400/15 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
      <div aria-hidden="true" className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-teal-300/10 blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: "6s", animationDelay: "0.5s" }} />

      {/* Floating balloons */}
      <div aria-hidden="true" className="absolute right-6 top-4 text-3xl opacity-90 animate-bounce" style={{ animationDuration: "3s" }}>🎈</div>
      <div aria-hidden="true" className="absolute right-16 top-10 text-2xl opacity-80 animate-bounce" style={{ animationDuration: "3.4s", animationDelay: "0.4s" }}>🎈</div>
      <div aria-hidden="true" className="absolute left-8 bottom-6 text-2xl opacity-70 animate-bounce hidden sm:block" style={{ animationDuration: "2.8s", animationDelay: "0.8s" }}>🎊</div>

      <div className="relative z-10 p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3.5">
          <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-lg shadow-amber-500/30">
            <PartyPopper size={22} className="text-[#4a0819]" aria-hidden="true" />
            <Sparkles size={13} className="absolute -right-1 -top-1 text-amber-200 animate-pulse" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200">It&apos;s your day ✨</p>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Happy Birthday! 🎉🎂</h2>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !greetings || greetings.length === 0 ? (
          <p className="text-sm text-white/70">🎈 No wishes yet — check back soon as your church family stops by to celebrate you!</p>
        ) : (
          <>
            <div key={page} className="wish-fade-in space-y-2.5">
              {visible.map((g, i) => (
                <div
                  key={g.id}
                  className="flex gap-2.5 rounded-xl bg-white/[0.09] backdrop-blur-sm p-3 border-l-4"
                  style={{ borderLeftColor: ACCENTS[i % ACCENTS.length] }}
                >
                  <Avatar member={g.Author} className="w-8 h-8 text-[11px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {g.Author.firstName} {g.Author.lastName}
                      </span>
                      <span className="text-[10px] text-white/40">{timeAgo(g.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-white/90 whitespace-pre-wrap break-words">{g.message}</p>
                  </div>
                </div>
              ))}
            </div>
            {pageCount > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-1" aria-hidden="true">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === page ? "w-5 bg-amber-300" : "w-1.5 bg-white/25"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** One row in the "celebrating soon" list, with an inline compose that opens on demand. */
function CelebrantRow({ celebrant }: { celebrant: CommunityBirthday }) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const addGreeting = useAddBirthdayGreeting();
  const isToday = celebrant.daysUntil === 0;

  function send() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    addGreeting.mutate(
      { memberId: celebrant.id, message: trimmed },
      {
        onSuccess: () => {
          setDraft("");
          setComposing(false);
          showToast.success(`🎉 Wish sent to ${celebrant.firstName}!`);
        },
        onError: () => showToast.error("Could not send your wish — try again"),
      },
    );
  }

  return (
    <div
      className={`rounded-xl border p-2.5 transition-colors ${
        isToday
          ? "border-amber-400/50 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-400/10 dark:border-amber-400/30"
          : "border-[#E7CDD3]/50 dark:border-white/[0.07]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className={`rounded-full ${isToday ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-white dark:ring-offset-[#140b10]" : ""}`}>
          <Avatar member={celebrant} className="w-9 h-9 text-xs" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#111] dark:text-white">
            {celebrant.firstName} {celebrant.lastName}
          </p>
          <p
            className={
              isToday
                ? "text-[11px] font-bold text-amber-600 dark:text-amber-400"
                : `text-[11px] ${muted}`
            }
          >
            {daysUntilLabel(celebrant.daysUntil)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setComposing((v) => !v)}
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[#87102C]/20 dark:border-[#FFB3C1]/20 px-3 py-1.5 text-[11px] font-semibold text-[#87102C] dark:text-[#FFB3C1] hover:bg-[#FFF4F6] dark:hover:bg-white/5 transition-colors"
        >
          <MessageCircleHeart size={12} aria-hidden="true" />
          {composing ? "Cancel" : "Send a wish"}
        </button>
      </div>

      {composing && (
        <div className="mt-2.5 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={1}
            autoFocus
            placeholder={`Write a birthday wish for ${celebrant.firstName}…`}
            className="flex-1 text-sm rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={addGreeting.isPending || !draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#87102C] text-white hover:bg-[#6E0C24] disabled:opacity-40 transition-all"
            aria-label="Send wish"
          >
            {addGreeting.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      )}
    </div>
  );
}

export function BirthdayCard({
  memberId,
  birthdayDaysUntil,
  communityBirthdays = [],
}: {
  memberId: string | null;
  birthdayDaysUntil: number | null;
  communityBirthdays?: MemberHomeProps["communityBirthdays"];
}) {
  const isMyBirthdayToday = birthdayDaysUntil === 0 && !!memberId;
  // Don't show myself in the "others celebrating" list.
  const others = (communityBirthdays ?? []).filter((c) => c.id !== memberId);

  if (!isMyBirthdayToday && others.length === 0) return null;

  return (
    <div className="space-y-4">
      {isMyBirthdayToday && <MyBirthdayWall memberId={memberId} />}

      {others.length > 0 && (
        <div className={card}>
          <div className={`flex items-center gap-3 px-5 py-4 ${hdrBdr}`}>
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 to-rose-200 dark:from-amber-400/25 dark:to-rose-400/20">
              <Cake size={17} className={iconCl} aria-hidden="true" />
            </span>
            <div>
              <p className={kicker}>Church Family</p>
              <h3 className={cardTitle}>Celebrating Soon 🎈</h3>
            </div>
          </div>
          <div className="p-4 space-y-2.5">
            {others.map((c) => (
              <CelebrantRow key={c.id} celebrant={c} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
