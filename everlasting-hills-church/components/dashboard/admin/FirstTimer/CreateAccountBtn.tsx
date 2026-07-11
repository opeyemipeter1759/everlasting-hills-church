"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import Loader from "@/components/ui/feedback/Loader";
import type { VisitorRow } from "./types";

export default function CreateAccountBtn({
  visitor,
  onCreated,
}: {
  visitor: VisitorRow;
  onCreated: (visitorId: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (!visitor.email || !visitor.phone) {
    return <span className="text-xs text-[#b8a8ac] dark:text-white/30">No email/phone</span>;
  }

  async function handleCreate() {
    setLoading(true);
    try {
      await apiClient.post(`/members/convert-visitor/${visitor.id}`);
      showToast.success(`${visitor.firstName} ${visitor.lastName} is now a member`);
      onCreated(visitor.id);
    } catch (err) {
      showToast.error((err as { message?: string }).message ?? "Couldn't create account");
    } finally {
      setLoading(false);
    }
  }

  const highlighted = visitor.membershipInterest === "Yes";
  return (
    <button
      type="button"
      onClick={handleCreate}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 whitespace-nowrap ${
        highlighted
          ? "bg-[#87102C] text-white hover:bg-[#6E0C24]"
          : "bg-[#FFF4F6] dark:bg-white/[0.06] text-[#5A4A4D] dark:text-white/60 border border-[#E7CDD3]/60 dark:border-white/[0.10] hover:bg-[#FFE8ED] dark:hover:bg-white/[0.10]"
      }`}
    >
      {loading && <Loader size="xs" />}
      {loading ? "Creating…" : "Create Account"}
    </button>
  );
}
