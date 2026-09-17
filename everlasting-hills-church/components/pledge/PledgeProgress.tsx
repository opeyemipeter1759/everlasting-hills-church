"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  ReceiptText,
} from "lucide-react";
import {
  formatNaira,
  useAddPledgeInstallment,
  type Pledge,
  type PledgeInstallmentTarget,
} from "@/lib/api/pledges";
import { userMessageForError } from "@/lib/api/user-message";

const lagosToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

const digitsOnly = (value: string) =>
  value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 11);
const grouped = (digits: string) =>
  digits ? Number(digits).toLocaleString("en-NG") : "";

function mutationError(error: unknown) {
  if (error && typeof error === "object" && "status" in error && error.status === 404) {
    return "Installment tracking is temporarily unavailable. Your payment was not recorded. Please try again shortly.";
  }
  return userMessageForError(
    error,
    "We couldn't record this installment. Your progress has not changed; please try again.",
  );
}

export default function PledgeProgress({
  pledge,
  target,
}: {
  pledge: Pledge;
  target: PledgeInstallmentTarget;
}) {
  const today = lagosToday();
  const suggested =
    pledge.installmentAmount && pledge.installmentAmount <= pledge.balance
      ? pledge.installmentAmount
      : pledge.balance;
  const [amount, setAmount] = useState(suggested > 0 ? String(suggested) : "");
  const [givenOn, setGivenOn] = useState(today);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const add = useAddPledgeInstallment(target);
  const installments = useMemo(
    () =>
      [...(pledge.installments ?? [])].sort((a, b) =>
        b.givenOn.localeCompare(a.givenOn),
      ),
    [pledge.installments],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSavedMessage("");
    const numericAmount = Number(amount);
    if (!numericAmount) return setFormError("Enter the amount you gave");
    if (numericAmount > pledge.balance) {
      return setFormError(
        `Only ${formatNaira(pledge.balance)} remains on this pledge`,
      );
    }
    if (!givenOn || givenOn > today)
      return setFormError("Choose today or an earlier date");
    try {
      const updated = await add.mutateAsync({
        amount: numericAmount,
        givenOn,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setSavedMessage(
        `${formatNaira(numericAmount)} recorded. Your new balance is ${formatNaira(updated.balance)}.`,
      );
      const nextSuggested =
        updated.installmentAmount &&
        updated.installmentAmount <= updated.balance
          ? updated.installmentAmount
          : updated.balance;
      setAmount(nextSuggested > 0 ? String(nextSuggested) : "");
      setNote("");
    } catch {
      // The normalized API message is rendered below.
    }
  }

  return (
    <div className="mt-5 border-t border-[#dcb9a4]/60 pt-5 dark:border-white/10">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl bg-white/70 p-3 dark:bg-white/5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-white/50">
            Pledged
          </p>
          <p className="mt-1 break-words text-sm font-black tabular-nums text-gray-900 dark:text-white sm:text-lg">
            {formatNaira(pledge.amount)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Given
          </p>
          <p className="mt-1 break-words text-sm font-black tabular-nums text-emerald-800 dark:text-emerald-200 sm:text-lg">
            {formatNaira(pledge.amountGiven ?? 0)}
          </p>
        </div>
        <div className="rounded-xl bg-[#87102C]/5 p-3 dark:bg-rose-300/10">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#87102C] dark:text-rose-300">
            Balance
          </p>
          <p className="mt-1 break-words text-sm font-black tabular-nums text-[#87102C] dark:text-rose-200 sm:text-lg">
            {formatNaira(pledge.balance ?? pledge.amount)}
          </p>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Pledge completion"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pledge.progressPercent ?? 0}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#87102C] to-emerald-500 transition-[width] duration-500"
          style={{ width: `${pledge.progressPercent ?? 0}%` }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs font-bold text-gray-500 dark:text-white/55">
        {pledge.progressPercent ?? 0}% complete
      </p>

      {pledge.balance <= 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200">
          <CheckCircle2
            size={21}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="font-black">Pledge completed</p>
            <p className="mt-0.5 text-xs opacity-80">
              Thank you for fulfilling your financial pledge.
            </p>
          </div>
        </div>
      ) : (
        <>
          <Link
            href="/give"
            className="mt-3 inline-flex min-h-11 items-center text-xs font-bold text-[#87102C] hover:underline dark:text-rose-300"
          >
            Make a payment or view church giving accounts
          </Link>
          <details className="mt-1 rounded-2xl border border-[#dcb9a4]/60 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-black text-[#87102C] marker:hidden dark:text-rose-200">
              <Plus size={17} aria-hidden="true" /> Record an installment
            </summary>
            <form
              onSubmit={submit}
              className="space-y-3 border-t border-[#dcb9a4]/50 p-4 dark:border-white/10"
            >
              <p className="text-xs leading-relaxed text-gray-500 dark:text-white/55">
                Record this after you make a payment or transfer. It updates
                your progress; it does not charge your card.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-bold text-gray-700 dark:text-white/75">
                  Amount given
                  <span className="relative mt-1 block">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
                      ₦
                    </span>
                    <input
                      aria-label="Installment amount given"
                      inputMode="numeric"
                      value={grouped(amount)}
                      onChange={(event) =>
                        setAmount(digitsOnly(event.target.value))
                      }
                      className="min-h-11 w-full rounded-xl border border-gray-200 bg-white pl-7 pr-3 text-sm font-bold outline-none focus:border-[#87102C] dark:border-white/15 dark:bg-white/5 dark:text-white"
                    />
                  </span>
                </label>
                <label className="text-xs font-bold text-gray-700 dark:text-white/75">
                  Date given
                  <input
                    aria-label="Date installment was given"
                    type="date"
                    max={today}
                    value={givenOn}
                    onChange={(event) => setGivenOn(event.target.value)}
                    className="mt-1 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/15 dark:bg-white/5 dark:text-white"
                  />
                </label>
              </div>
              <label className="block text-xs font-bold text-gray-700 dark:text-white/75">
                Note{" "}
                <span className="font-normal text-gray-400">(optional)</span>
                <input
                  aria-label="Installment note"
                  maxLength={160}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="For example: bank transfer"
                  className="mt-1 min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/15 dark:bg-white/5 dark:text-white"
                />
              </label>
              {(formError || add.isError) && (
                <p
                  role="alert"
                  className="text-sm font-medium text-red-600 dark:text-red-300"
                >
                  {formError || mutationError(add.error)}
                </p>
              )}
              {savedMessage && (
                <p
                  role="status"
                  className="text-sm font-medium text-emerald-700 dark:text-emerald-300"
                >
                  {savedMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={add.isPending}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#87102C] px-4 text-sm font-black text-white hover:bg-[#6f0d24] disabled:opacity-60 sm:w-auto"
              >
                {add.isPending ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Plus size={16} aria-hidden="true" />
                )}
                {add.isPending ? "Recording…" : "Record installment"}
              </button>
            </form>
          </details>
        </>
      )}

      <details className="mt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 py-2 text-sm font-bold text-gray-700 marker:hidden dark:text-white/75">
          <ReceiptText size={16} aria-hidden="true" />
          Giving history ({installments.length})
        </summary>
        {installments.length ? (
          <ol className="mt-1 space-y-2">
            {installments.map((installment) => (
              <li
                key={installment.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-white/70 p-3 text-sm dark:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="font-black tabular-nums text-gray-900 dark:text-white">
                    {formatNaira(installment.amount)}
                  </p>
                  {installment.note && (
                    <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-white/50">
                      {installment.note}
                    </p>
                  )}
                </div>
                <time
                  dateTime={installment.givenOn}
                  className="inline-flex shrink-0 items-center gap-1 text-xs text-gray-500 dark:text-white/50"
                >
                  <CalendarDays size={13} aria-hidden="true" />{" "}
                  {shortDate(installment.givenOn)}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl bg-white/60 p-3 text-xs text-gray-500 dark:bg-white/5 dark:text-white/50">
            No giving has been recorded against this pledge yet.
          </p>
        )}
      </details>
    </div>
  );
}
