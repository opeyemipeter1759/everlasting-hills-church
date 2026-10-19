"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import Loader from "@/components/ui/feedback/Loader";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import type { VisitorRow } from "./types";

export default function CreateAccountBtn({
  visitor,
  onCreated,
}: {
  visitor: VisitorRow;
  onCreated: (visitorId: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sundays, setSundays] = useState("0");

  if (!visitor.email || !visitor.phone) {
    return <span className="text-xs text-[#b8a8ac] dark:text-white/30">No email/phone</span>;
  }

  const isOnline = visitor.attendanceType === "Online";
  const needsEarlyAccountOverride = isOnline && !visitor.hasOnlineCheckIn;

  async function createAccount() {
    setLoading(true);
    try {
      const creditedSundays = Math.max(0, Math.min(12, Math.trunc(Number(sundays) || 0)));
      await apiClient.post(`/members/convert-visitor/${visitor.id}`, { creditedSundays });
      showToast.success(`${visitor.firstName} ${visitor.lastName} is now a member`);
      setConfirming(false);
      onCreated(visitor.id);
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Couldn't create account");
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setSundays("0");
    setConfirming(true);
  }

  const highlighted = visitor.membershipInterest === "Yes";
  return (
    <>
      <button
        type="button"
        onClick={handleCreate}
        disabled={loading}
        title={needsEarlyAccountOverride ? "No second online visit is recorded" : undefined}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/30 focus-visible:ring-offset-2 ${
          needsEarlyAccountOverride
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 hover:bg-amber-500/15"
            : highlighted
              ? "bg-[#87102C] text-white hover:bg-[#6E0C24]"
              : "bg-[#FFF4F6] dark:bg-white/[0.06] text-[#5A4A4D] dark:text-white/60 border border-[#E7CDD3]/60 dark:border-white/[0.10] hover:bg-[#FFE8ED] dark:hover:bg-white/[0.10]"
        }`}
      >
        {loading && <Loader size="xs" />}
        {loading ? "Creating…" : "Create Account"}
      </button>

      <ConfirmDialog
        open={confirming}
        tone={needsEarlyAccountOverride ? "warning" : "info"}
        title={needsEarlyAccountOverride ? "Create account before the second visit?" : "Create an account?"}
        description={
          <div className="space-y-3">
            <p>
              {needsEarlyAccountOverride ? "No second online visit is recorded for " : "This creates a member account for "}
              <strong className="text-gray-900 dark:text-white">
                {visitor.firstName} {visitor.lastName}
              </strong>
              {needsEarlyAccountOverride
                ? ". Creating the account will add them as a member in training now."
                : ". They start as a member in training and are emailed how to sign in."}
            </p>
            <label className="block text-sm">
              <span className="block font-semibold text-gray-900 dark:text-white">Sundays already attended</span>
              <span className="block text-xs text-gray-500 dark:text-white/50">
                Services before today that were not checked in. They count toward the Membership Class.
              </span>
              <input
                type="number"
                min={0}
                max={12}
                value={sundays}
                onChange={(e) => setSundays(e.target.value)}
                className="mt-1 w-24 rounded-lg border border-gray-200 px-2 py-1 text-gray-900 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
              />
            </label>
          </div>
        }
        confirmLabel="Create Account"
        loading={loading}
        onConfirm={createAccount}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
