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
  const [confirmEarlyAccount, setConfirmEarlyAccount] = useState(false);

  if (!visitor.email || !visitor.phone) {
    return <span className="text-xs text-[#b8a8ac] dark:text-white/30">No email/phone</span>;
  }

  const isOnline = visitor.attendanceType === "Online";
  const needsEarlyAccountOverride = isOnline && !visitor.hasOnlineCheckIn;

  async function createAccount() {
    setLoading(true);
    try {
      await apiClient.post(`/members/convert-visitor/${visitor.id}`);
      showToast.success(`${visitor.firstName} ${visitor.lastName} is now a member`);
      setConfirmEarlyAccount(false);
      onCreated(visitor.id);
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Couldn't create account");
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    if (needsEarlyAccountOverride) {
      setConfirmEarlyAccount(true);
      return;
    }
    void createAccount();
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
        open={confirmEarlyAccount}
        tone="warning"
        title="Create account before the second visit?"
        description={
          <>
            No second online visit is recorded for{" "}
            <strong className="text-gray-900 dark:text-white">
              {visitor.firstName} {visitor.lastName}
            </strong>
            . Creating the account will add them as an active member now.
          </>
        }
        confirmLabel="Create Account"
        loading={loading}
        onConfirm={createAccount}
        onCancel={() => setConfirmEarlyAccount(false)}
      />
    </>
  );
}
