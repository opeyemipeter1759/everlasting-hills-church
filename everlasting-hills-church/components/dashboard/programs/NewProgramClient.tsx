"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { useProgramAction, type AdminProgram } from "@/lib/api/programs-admin";
import { card, hint, input, label, primary } from "./ui";

/** Start a program with a name and a line about it; everything else is filled in on its page. It stays a draft. */
export default function NewProgramClient() {
  const router = useRouter();
  const action = useProgramAction();
  const [name, setName] = useState("");
  const [shortDescription, setShort] = useState("");
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const p = (await action.mutateAsync({ method: "post", path: "/programs", body: { name, shortDescription } })) as AdminProgram;
      router.replace(`/dashboard/admin/programs/${p.id}`);
    } catch (err) {
      showToast.error((err as ApiError).message || "The program was not created. Try again.");
    }
  };
  return (
    <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold text-[#111] dark:text-white">New program</h1>
      <form onSubmit={create} className={`${card} mt-5 space-y-4`}>
        <label className="block">
          <span className={label}>Name</span>
          <input className={`${input} mt-1`} value={name} maxLength={80} required onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className={label}>Short description</span>
          <textarea className={`${input} mt-1 py-2`} rows={3} maxLength={280} required value={shortDescription} onChange={(e) => setShort(e.target.value)} />
          <span className={hint}>One or two sentences for the card. You can change it later.</span>
        </label>
        <button type="submit" className={primary} disabled={!name.trim() || !shortDescription.trim() || action.isPending}>
          {action.isPending ? "Creating…" : "Create draft"}
        </button>
      </form>
    </div>
  );
}
