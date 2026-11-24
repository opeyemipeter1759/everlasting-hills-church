"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { AdminProgram, AdminScripture, AdminSession, ProgramFields } from "@/lib/api/programs-admin";
import type { Edition } from "@/lib/programs";

const FIELD_KEYS: (keyof ProgramFields)[] = [
  "slug", "name", "nameStatus", "eyebrow", "shortDescription", "longDescription", "programType", "cadence", "recurrenceRule",
  "startTime", "durationMinutes", "startOffsetDays", "timezone", "dateStatus", "format", "venue", "streamUrl", "logoUrl",
  "coverUrl", "accent", "ctaLabel", "ctaUrl", "featured",
];
const pick = (p: AdminProgram): ProgramFields => Object.fromEntries(FIELD_KEYS.map((k) => [k, p[k]])) as unknown as ProgramFields;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const scripturesOf = (s: AdminScripture[]) => s.map(({ reference, status }) => ({ reference, status }));

/**
 * The form's working copy of a program. Saving sends only what changed: a
 * PATCH with the changed fields, and a replace for each changed list
 * (scriptures, sessions, editions). Leaving with unsaved changes asks first.
 */
export function useProgramDraft(program: AdminProgram) {
  const qc = useQueryClient();
  const [base, setBase] = useState(program);
  const [fields, setFields] = useState(() => pick(program));
  const [scriptures, setScriptures] = useState(() => scripturesOf(program.scriptures));
  const [sessions, setSessions] = useState<AdminSession[]>(program.sessions);
  const [editions, setEditions] = useState<Edition[]>(program.editions);
  const [saving, setSaving] = useState(false);

  const changed = useMemo(() => {
    const original = pick(base);
    return Object.fromEntries(FIELD_KEYS.filter((k) => !same(fields[k], original[k])).map((k) => [k, fields[k]])) as Partial<ProgramFields>;
  }, [fields, base]);
  const lists = {
    scriptures: !same(scriptures, scripturesOf(base.scriptures)),
    sessions: !same(sessions, base.sessions),
    editions: !same(editions, base.editions),
  };
  const dirty = Object.keys(changed).length > 0 || lists.scriptures || lists.sessions || lists.editions;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof ProgramFields>(key: K, value: ProgramFields[K]) => setFields((f) => ({ ...f, [key]: value }));
  const patch = (next: Partial<ProgramFields>) => setFields((f) => ({ ...f, ...next }));

  /** Saves in order; on the first refusal it stops, keeping the edits on screen. */
  async function save(): Promise<AdminProgram> {
    setSaving(true);
    try {
      const id = base.id;
      let latest = base;
      if (Object.keys(changed).length) latest = await api.patch<AdminProgram>(`/programs/${id}`, changed);
      if (lists.scriptures) latest = await api.put<AdminProgram>(`/programs/${id}/scriptures`, { scriptures });
      if (lists.sessions) latest = await api.put<AdminProgram>(`/programs/${id}/sessions`, { sessions });
      if (lists.editions) latest = await api.put<AdminProgram>(`/programs/${id}/editions`, { editions });
      setBase(latest);
      setFields(pick(latest));
      setScriptures(scripturesOf(latest.scriptures));
      setSessions(latest.sessions);
      setEditions(latest.editions);
      await qc.invalidateQueries({ queryKey: ["programs-admin"] });
      return latest;
    } finally {
      setSaving(false);
    }
  }

  return { base, setBase, fields, set, patch, scriptures, setScriptures, sessions, setSessions, editions, setEditions, dirty, saving, save };
}

export type ProgramDraft = ReturnType<typeof useProgramDraft>;
