"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, HeartHandshake, Loader2 } from "lucide-react";
import { Combobox } from "@/components/ui/form/Combobox";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { useMemberSearch } from "@/lib/api";
import {
  useCancelSpouseRequest,
  useMySpouse,
  useRequestSpouse,
  useRespondToSpouse,
  useUnlinkSpouse,
  type FamilyPerson,
} from "@/lib/api/family";

const errorOf = (err: unknown, fallback: string) => (err as { message?: string } | null)?.message ?? fallback;

const box =
  "rounded-xl border border-[#E7CDD3]/60 dark:border-white/[0.10] bg-[#FFF8F9] dark:bg-white/[0.04] p-4";
const smallButton =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors disabled:opacity-60";

function Avatar({ person }: { person: FamilyPerson }) {
  const initials = person.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return person.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={person.photoUrl} alt="" className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] text-xs font-bold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
      {initials}
    </span>
  );
}

/**
 * Requests from members who say they are married to me. Nothing shows on
 * either profile until I accept. Used in Settings and on the dashboard home.
 */
export function SpouseRequestsInbox({ compact = false }: { compact?: boolean }) {
  const { data } = useMySpouse();
  const respond = useRespondToSpouse();
  const [error, setError] = useState<string | null>(null);
  const requests = data?.pendingReceived ?? [];
  if (requests.length === 0) return null;

  async function answer(id: string, accept: boolean) {
    setError(null);
    try {
      await respond.mutateAsync({ id, accept });
    } catch (err) {
      setError(errorOf(err, "Could not answer that request. Please try again."));
    }
  }

  return (
    <section aria-label="Spouse requests" className={compact ? "" : "space-y-3"}>
      {requests.map((r) => (
        <div key={r.id} className={`${box} flex flex-col gap-3 sm:flex-row sm:items-center`}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar person={r.from} />
            <p className="text-sm text-[#111] dark:text-white">
              <span className="font-bold">{r.from.name}</span> listed you as their spouse. Confirm it to show you as married to
              each other on your profiles.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={respond.isPending}
              onClick={() => answer(r.id, true)}
              className={`${smallButton} bg-[#87102C] text-white hover:bg-[#6E0C24]`}
            >
              Confirm
            </button>
            <button
              type="button"
              disabled={respond.isPending}
              onClick={() => answer(r.id, false)}
              className={`${smallButton} border border-[#E7CDD3] text-[#5A4A4D] hover:bg-white dark:border-white/[0.14] dark:text-white/70`}
            >
              Decline
            </button>
          </div>
        </div>
      ))}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}

/**
 * Who I am married to, when my spouse is a church member: pick them, and they
 * are asked to confirm. Shows the link once they have, or the wait until then.
 */
export function SpouseLink({ selfId }: { selfId?: string | null }) {
  const { data, isLoading } = useMySpouse();
  const request = useRequestSpouse();
  const cancel = useCancelSpouseRequest();
  const unlink = useUnlinkSpouse();
  const [query, setQuery] = useState("");
  const [searchFor, setSearchFor] = useState("");
  const [chosen, setChosen] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchFor(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  const found = useMemberSearch(searchFor);
  /** The chosen member's name, kept while the search moves on. */
  const [chosenLabel, setChosenLabel] = useState("");

  if (isLoading || !data) {
    return <div className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />;
  }

  async function run(action: () => Promise<unknown>, fallback: string) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorOf(err, fallback));
    }
  }

  const errorLine = error && (
    <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
      {error}
    </p>
  );

  if (data.spouse) {
    const spouse = data.spouse;
    return (
      <div>
        <div className={`${box} flex items-center gap-3`}>
          <Avatar person={spouse} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#111] dark:text-white">
              Married to{" "}
              <Link href={`/dashboard/family/${spouse.id}`} className="text-[#87102C] hover:underline dark:text-[#FFB3C1]">
                {spouse.name}
              </Link>
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 size={12} aria-hidden="true" /> Confirmed by both of you
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="min-h-11 text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
          >
            Remove
          </button>
        </div>
        {errorLine}
        <ConfirmDialog
          open={confirmRemove}
          tone="danger"
          title="Remove your spouse link?"
          description={`You and ${spouse.name} will no longer show as married to each other. Either of you can ask again later.`}
          confirmLabel="Remove link"
          loading={unlink.isPending}
          onCancel={() => setConfirmRemove(false)}
          onConfirm={async () => {
            await run(() => unlink.mutateAsync(), "Could not remove the link. Please try again.");
            setConfirmRemove(false);
          }}
        />
      </div>
    );
  }

  if (data.pendingSent) {
    const to = data.pendingSent.to;
    return (
      <div>
        <div className={`${box} flex items-center gap-3`}>
          <Avatar person={to} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#111] dark:text-white">{to.name}</p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
              <Clock size={12} aria-hidden="true" /> Waiting for them to confirm. Nothing shows on your profiles until they do.
            </p>
          </div>
          <button
            type="button"
            disabled={cancel.isPending}
            onClick={() => run(() => cancel.mutateAsync(), "Could not withdraw the request. Please try again.")}
            className="min-h-11 text-sm font-semibold text-[#87102C] hover:underline disabled:opacity-60 dark:text-[#FFB3C1]"
          >
            Withdraw
          </button>
        </div>
        {errorLine}
      </div>
    );
  }

  const options = (found.data ?? [])
    .filter((m) => m.id !== selfId)
    .map((m) => ({ id: m.id, label: `${m.firstName} ${m.lastName}`.trim() }));
  if (chosen && chosenLabel && !options.some((o) => o.id === chosen)) options.unshift({ id: chosen, label: chosenLabel });

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="min-w-0 flex-1">
          <Combobox
            options={options}
            value={chosen}
            onChange={(id) => {
              setChosen(id);
              setChosenLabel(options.find((o) => o.id === id)?.label ?? "");
            }}
            onQueryChange={setQuery}
            placeholder="Find your spouse by name"
            searchPlaceholder="Type their name…"
            emptyText={query.trim().length < 2 ? "Type at least 2 letters of their name." : found.isFetching ? "Searching…" : "No member with that name."}
          />
        </div>
        <button
          type="button"
          disabled={!chosen || request.isPending}
          onClick={() =>
            run(async () => {
              await request.mutateAsync(chosen);
              setChosen("");
            }, "Could not send the request. Please try again.")
          }
          className={`${smallButton} gap-2 bg-[#87102C] text-white hover:bg-[#6E0C24]`}
        >
          {request.isPending ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <HeartHandshake size={15} aria-hidden="true" />}
          Send request
        </button>
      </div>
      <p className="mt-1.5 text-xs text-[#8a7e80] dark:text-white/45">
        They will be asked to confirm. You show as married to each other only after they agree.
      </p>
      {errorLine}
    </div>
  );
}
