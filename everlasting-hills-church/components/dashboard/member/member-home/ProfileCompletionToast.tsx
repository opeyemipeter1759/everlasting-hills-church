"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toastLib from "react-hot-toast";
import { UserCog, X } from "lucide-react";
import type { MemberHomeProps } from "./types";
import { getProfileCompletion } from "./helpers";

const TOAST_ID = "profile-completion-toast";
const DISMISS_KEY = "profile-completion-toast-dismissed";

function dismissForSession() {
  toastLib.dismiss(TOAST_ID);
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // sessionStorage unavailable (private mode, etc.) — toast just won't persist dismissal.
  }
}

/** Renders nothing — just pops up a toast prompting the member to finish their
 *  profile whenever the dashboard home loads while it's incomplete. Dismissing
 *  it suppresses the toast for the rest of the browser session (sessionStorage);
 *  it returns on the next fresh session as long as the profile stays incomplete. */
export function ProfileCompletionToast({ member }: { member: MemberHomeProps["member"] }) {
  const router = useRouter();

  useEffect(() => {
    if (!member) return;
    const { complete, pct } = getProfileCompletion(member);
    if (complete) return;

    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // sessionStorage unavailable — fall through and show the toast.
    }

    // Fixed id: a second call (e.g. React StrictMode's double-invoke in dev,
    // or this component remounting) replaces the same toast in place instead
    // of stacking a duplicate.
    toastLib.custom(
      (t) => (
        <div
          className={`flex items-center gap-3 rounded-xl border border-[#E7CDD3] bg-white px-4 py-3 shadow-lg dark:border-white/10 dark:bg-[#1c1c1e] ${
            t.visible ? "animate-in fade-in" : "animate-out fade-out"
          }`}
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFE8ED] dark:bg-[#87102C]/25">
            <UserCog size={16} className="text-[#87102C] dark:text-[#FFB3C1]" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#111] dark:text-white">Your profile is {pct}% complete</p>
            <button
              type="button"
              onClick={() => {
                dismissForSession();
                router.push("/dashboard/profile");
              }}
              className="mt-1 text-xs font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]"
            >
              Complete it now →
            </button>
          </div>
          <button
            type="button"
            onClick={() => dismissForSession()}
            aria-label="Dismiss"
            className="ml-1 flex-shrink-0 rounded-lg p-2 -m-2 text-gray-300 hover:text-gray-500 dark:text-white/30 dark:hover:text-white/60"
          >
            <X size={14} />
          </button>
        </div>
      ),
      { id: TOAST_ID, duration: Infinity, position: "top-center" }
    );
    // Deliberately no cleanup/dismiss here — it should persist across
    // remounts and only go away when the member dismisses it themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.bio, member?.phone, member?.address, member?.photoUrl]);

  return null;
}
