"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { assistWriting, type WritingAction } from "@/lib/api/writing-assist";
import type { AssistTarget, Job } from "./actions";

function failureMessage(err: unknown): string {
  const e = err as { message?: string; status?: number; code?: string };
  if (e.status === 429) return "You have used the writing assistant a lot in the last minute. Wait a moment and try again.";
  if (e.code === "ECONNABORTED") return "The assistant took too long to answer. Try again, or select a smaller part of the story.";
  return e.message || "The assistant could not answer. Please try again.";
}

/** Runs one AI request at a time; a newer request, Discard or unmounting cancels it. */
export function useWritingAssist(context: { title: string; subtitle: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const controller = useRef<AbortController | null>(null);
  const contextRef = useRef(context);
  contextRef.current = context;

  const run = useCallback((action: WritingAction, target: AssistTarget) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setJob({ status: "loading", action, target });
    const { title, subtitle } = contextRef.current;
    const ctx = { title: title.trim() || undefined, subtitle: subtitle.trim() || undefined };
    assistWriting(action, target.text, ctx, ctrl.signal)
      .then((result) => {
        if (!ctrl.signal.aborted) setJob({ status: "done", action, target, result });
      })
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setJob({ status: "error", action, target, message: failureMessage(err) });
      });
  }, []);

  const close = useCallback(() => {
    controller.current?.abort();
    setJob(null);
  }, []);

  useEffect(() => () => controller.current?.abort(), []);

  return { job, run, close };
}
