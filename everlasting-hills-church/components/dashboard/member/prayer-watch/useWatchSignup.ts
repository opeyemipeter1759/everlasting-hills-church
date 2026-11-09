"use client";

import { useEffect, useMemo, useState } from "react";
import { useMe } from "@/lib/api";
import { userMessageForError } from "@/lib/api/user-message";
import { useSubmitPrayerSignup } from "@/lib/api/prayer-watch";

/**
 * The sign-up form's state. The member's own profile fills in their name,
 * email and phone, so the form only asks for what the profile is missing.
 */
export function useWatchSignup(onFailed: () => void) {
  const me = useMe();
  const submit = useSubmitPrayerSignup();
  const profile = me.data?.member;
  const knownName = useMemo(() => [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim(), [profile]);
  const isWorker =
    Boolean(profile?.units?.length) || Boolean(me.data?.headUsher) || Boolean(me.data?.unitLeadOf?.length) || Boolean(me.data?.hodOf?.length);

  const [slotId, setSlotId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled || !profile) return;
    setFullName(knownName);
    setEmail(profile.email ?? "");
    setPhone(profile.phone ?? "");
    setPrefilled(true);
  }, [profile, knownName, prefilled]);

  // Only ask for what the member's own profile doesn't already tell us.
  const needs = { name: prefilled && !knownName, email: prefilled && !profile?.email, phone: prefilled && !profile?.phone };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!slotId) return setError("Choose a prayer watch hour.");
    if (!fullName.trim() || !phone.trim() || !email.trim()) return setError("We're missing some of your details — please fill them in below.");
    if (!agreed) return setError("Please confirm you'll be committed to this prayer watch hour.");
    try {
      await submit.mutateAsync({ slotId, fullName: fullName.trim(), phone: phone.trim(), email: email.trim(), isWorker });
    } catch (err) {
      setError(userMessageForError(err, "Couldn't complete your sign-up. Please try again."));
      onFailed();
    }
  }

  return {
    meLoading: me.isLoading,
    fields: { slotId, fullName, phone, email, agreed },
    set: { slotId: setSlotId, fullName: setFullName, phone: setPhone, email: setEmail, agreed: setAgreed },
    needs,
    error,
    submitting: submit.isPending,
    handleSubmit,
  };
}

export type WatchSignup = ReturnType<typeof useWatchSignup>;
