"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "ehc:registered-events";

function readStored(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Tracks which events this browser has successfully RSVP'd to, so a
 *  "Register Now" button can flip to a persistent "Registered" state. */
export function useRegisteredEvents() {
  const [registered, setRegistered] = useState<Set<string>>(new Set());

  useEffect(() => {
    setRegistered(readStored());
  }, []);

  const isRegistered = useCallback((eventId: string) => registered.has(eventId), [registered]);

  const markRegistered = useCallback((eventId: string) => {
    setRegistered((prev) => {
      const next = new Set(prev).add(eventId);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  return { isRegistered, markRegistered };
}
