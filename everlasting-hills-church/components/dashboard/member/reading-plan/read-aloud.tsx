"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Passage } from "@/lib/api/reading-plan";

/**
 * Reading the day's passages aloud with the device's own speech voices.
 *
 * The Web Speech API ships with every current phone and desktop browser and
 * reads whichever translation is on screen, so no audio has to be recorded,
 * licensed or hosted. Voices differ by device: a phone's are usually natural,
 * an older computer's can sound robotic, which is why the voice is choosable.
 *
 * One utterance per verse, never a whole passage: Chrome cuts long utterances
 * off after roughly fifteen seconds, pause() is unreliable on Android, and a
 * verse is the natural unit to highlight and to pick up from. Pausing cancels
 * speech and remembers the verse; resuming reads that verse again.
 */

export interface ReadAloudPassage {
  sequence: number;
  reference: string;
  label: string | null;
  verses: Passage["verses"];
}

export interface Segment {
  sequence: number;
  verseId: number;
  text: string;
}

export type ReadAloudStatus = "idle" | "playing" | "paused" | "finished" | "error";

export const RATES = [0.75, 1, 1.25, 1.5] as const;

export const RATE_KEY = "ehc.read-aloud.rate";
const VOICE_KEY = "ehc.read-aloud.voice";
/** About twelve seconds at normal speed, under Chrome's cut-off even at 0.75×. */
const MAX_UTTERANCE = 180;
const ORDINALS: Record<string, string> = { "1": "First", "2": "Second", "3": "Third" };

/** "1 Samuel" is read "First Samuel"; a psalm is announced as a psalm. */
export function spokenHeading(book: string, chapter: number): string {
  const name = book.trim();
  if (/^psalms?$/i.test(name)) return `Psalm ${chapter}.`;
  return `${name.replace(/^([123])\s+/, (_match, n: string) => `${ORDINALS[n]} `)}, chapter ${chapter}.`;
}

/** Small-capital divine names arrive as capitals, which some voices spell out. */
export function speakableText(text: string): string {
  return text
    .replace(/\bLORD\b/g, "Lord")
    .replace(/\bGOD\b/g, "God")
    .replace(/\bJEHOVAH\b/g, "Jehovah")
    .replace(/[¶†‡*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** A long verse split at its pauses, so no single utterance runs too long. */
export function chunkVerse(text: string, max = MAX_UTTERANCE): string[] {
  if (!text) return [];
  if (text.length <= max) return [text];
  const pieces = text.match(/[^.!?;:,]+[.!?;:,]*["'”’)\]]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if (current && current.length + piece.length > max) {
      chunks.push(current.trim());
      current = "";
    }
    current += piece;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/** Everything to be spoken, in reading order, each piece tied to its verse. */
export function buildSegments(passages: ReadAloudPassage[]): Segment[] {
  const segments: Segment[] = [];
  for (const passage of [...passages].sort((a, b) => a.sequence - b.sequence)) {
    let chapter = "";
    for (const verse of passage.verses) {
      const key = `${verse.book}:${verse.chapter}`;
      if (key !== chapter) {
        chapter = key;
        segments.push({ sequence: passage.sequence, verseId: verse.verseId, text: spokenHeading(verse.book, verse.chapter) });
      }
      for (const text of chunkVerse(speakableText(verse.text))) {
        segments.push({ sequence: passage.sequence, verseId: verse.verseId, text });
      }
    }
  }
  return segments;
}

/** English voices first; every voice if the device has no English one. */
export function englishVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  return english.length > 0 ? english : voices;
}

/**
 * The member's saved voice, otherwise the most natural English one, preferring
 * Nigerian, then British, then any English.
 */
export function preferredVoice(voices: SpeechSynthesisVoice[], savedURI: string | null): SpeechSynthesisVoice | null {
  const saved = savedURI ? voices.find((voice) => voice.voiceURI === savedURI) : undefined;
  if (saved) return saved;
  const score = (voice: SpeechSynthesisVoice) => {
    const lang = voice.lang.toLowerCase().replace("_", "-");
    let points = /natural|neural|premium|enhanced/i.test(voice.name) ? 4 : 0;
    if (lang === "en-ng") points += 3;
    else if (lang === "en-gb") points += 2;
    else if (lang.startsWith("en")) points += 1;
    if (voice.default) points += 0.5;
    return points;
  };
  return voices.reduce<SpeechSynthesisVoice | null>(
    (best, voice) => (!best || score(voice) > score(best) ? voice : best),
    null,
  );
}

function speech(): SpeechSynthesis | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (typeof window.SpeechSynthesisUtterance !== "function") return null;
  return window.speechSynthesis;
}

export function readSetting(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveSetting(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing or blocked storage: the choice lasts for this visit.
  }
}

export interface ReadAloudState {
  /** The device voice reading the text, or a recorded reading of each chapter. */
  kind?: "voice" | "recording";
  supported: boolean;
  /** Every passage of the day has loaded, so there is something to read. */
  ready: boolean;
  status: ReadAloudStatus;
  error: string | null;
  activeVerseId: number | null;
  current: { reference: string; label: string | null } | null;
  passageCount: number;
  rate: number;
  voices: SpeechSynthesisVoice[];
  voiceURI: string | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  skip: (direction: 1 | -1) => void;
  setRate: (rate: number) => void;
  setVoice: (voiceURI: string) => void;
}

export const PlayerContext = createContext<ReadAloudState | null>(null);
// Kept apart from the player so registering a passage, which every portion
// does once its text loads, does not depend on the verse being read.
export const RegisterContext = createContext<((passage: ReadAloudPassage) => void) | null>(null);

export function useReadAloud(): ReadAloudState | null {
  return useContext(PlayerContext);
}

/** The verse being read aloud, or null when nothing is. */
export function useActiveVerseId(): number | null {
  return useContext(PlayerContext)?.activeVerseId ?? null;
}

export function useRegisterPassage(): ((passage: ReadAloudPassage) => void) | null {
  return useContext(RegisterContext);
}

/**
 * Holds one day's reading. Keyed by the day and translation where it is used,
 * so moving to another day starts fresh and stops anything being read.
 */
export function ReadAloudProvider({ expected, children }: { expected: number; children: ReactNode }) {
  const [supported, setSupported] = useState(false);
  const [passages, setPassages] = useState<ReadonlyMap<number, ReadAloudPassage>>(() => new Map());
  const [status, setStatus] = useState<ReadAloudStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [rate, setRateState] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string | null>(null);

  const segments = useMemo(() => buildSegments(Array.from(passages.values())), [passages]);
  const segmentsRef = useRef(segments);
  const statusRef = useRef(status);
  const indexRef = useRef(0);
  // Bumped whenever speech is cancelled, so the cancelled utterance's own end
  // and error events cannot move the reading on.
  const tokenRef = useRef(0);
  const rateRef = useRef(1);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const synth = speech();
    if (!synth) return;
    setSupported(true);
    const savedRate = Number(readSetting(RATE_KEY));
    if ((RATES as readonly number[]).includes(savedRate)) {
      rateRef.current = savedRate;
      setRateState(savedRate);
    }
    const loadVoices = () => {
      const available = englishVoices(synth.getVoices());
      voicesRef.current = available;
      setVoices(available);
      const chosen = preferredVoice(available, readSetting(VOICE_KEY));
      voiceRef.current = chosen;
      setVoiceURI(chosen?.voiceURI ?? null);
    };
    loadVoices();
    // Voices load asynchronously on most browsers; older Safari only has the
    // handler property.
    if (typeof synth.addEventListener === "function") synth.addEventListener("voiceschanged", loadVoices);
    else synth.onvoiceschanged = loadVoices;
    return () => {
      if (typeof synth.removeEventListener === "function") synth.removeEventListener("voiceschanged", loadVoices);
      else synth.onvoiceschanged = null;
      tokenRef.current += 1;
      synth.cancel();
    };
  }, []);

  const speakFrom = useCallback(function speakFrom(index: number) {
    const synth = speech();
    if (!synth) return;
    const list = segmentsRef.current;
    if (index >= list.length) {
      indexRef.current = 0;
      setActiveIndex(null);
      setStatus("finished");
      return;
    }
    indexRef.current = index;
    setActiveIndex(index);
    const utterance = new window.SpeechSynthesisUtterance(list[index].text);
    utterance.rate = rateRef.current;
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current.lang;
    }
    tokenRef.current += 1;
    const token = tokenRef.current;
    utterance.onend = () => {
      if (token === tokenRef.current) speakFrom(index + 1);
    };
    utterance.onerror = (event) => {
      if (token !== tokenRef.current || event.error === "interrupted" || event.error === "canceled") return;
      tokenRef.current += 1;
      setStatus("error");
      setError("This device stopped reading aloud. Press Listen to try again.");
    };
    synth.speak(utterance);
  }, []);

  const startAt = useCallback((index: number) => {
    const synth = speech();
    if (!synth) return;
    const busy = synth.speaking || synth.pending;
    tokenRef.current += 1;
    const token = tokenRef.current;
    setError(null);
    setStatus("playing");
    // iOS only lets speech start inside the tap that asked for it, so an idle
    // engine is spoken to at once. Restarting mid-verse (a skip, a new speed)
    // cancels first, and Chrome can drop a speak() issued in the same tick as
    // cancel(), so that path waits a moment; by then the tap has unlocked it.
    if (!busy) {
      speakFrom(index);
      return;
    }
    synth.cancel();
    window.setTimeout(() => {
      if (token === tokenRef.current) speakFrom(index);
    }, 50);
  }, [speakFrom]);

  const play = useCallback(() => {
    if (segmentsRef.current.length > 0) startAt(indexRef.current);
  }, [startAt]);

  const pause = useCallback(() => {
    tokenRef.current += 1;
    speech()?.cancel();
    setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    tokenRef.current += 1;
    speech()?.cancel();
    indexRef.current = 0;
    setActiveIndex(null);
    setStatus("idle");
  }, []);

  const skip = useCallback((direction: 1 | -1) => {
    const list = segmentsRef.current;
    if (list.length === 0) return;
    const sequences = Array.from(new Set(list.map((segment) => segment.sequence)));
    const here = list[indexRef.current]?.sequence ?? sequences[0];
    const position = sequences.indexOf(here);
    const firstOf = (sequence: number) => list.findIndex((segment) => segment.sequence === sequence);
    let target: number;
    if (direction === 1) {
      if (position + 1 >= sequences.length) return;
      target = firstOf(sequences[position + 1]);
    } else {
      // Back restarts the passage under way, then steps to the one before.
      const start = firstOf(here);
      target = indexRef.current > start || position === 0 ? start : firstOf(sequences[position - 1]);
    }
    indexRef.current = target;
    if (statusRef.current === "playing") startAt(target);
    else setActiveIndex(target);
  }, [startAt]);

  const setRate = useCallback((next: number) => {
    rateRef.current = next;
    setRateState(next);
    saveSetting(RATE_KEY, String(next));
    if (statusRef.current === "playing") startAt(indexRef.current);
  }, [startAt]);

  const setVoice = useCallback((uri: string) => {
    const voice = voicesRef.current.find((candidate) => candidate.voiceURI === uri) ?? null;
    voiceRef.current = voice;
    setVoiceURI(voice?.voiceURI ?? null);
    if (voice) saveSetting(VOICE_KEY, voice.voiceURI);
    if (statusRef.current === "playing") startAt(indexRef.current);
  }, [startAt]);

  const register = useCallback((passage: ReadAloudPassage) => {
    setPassages((previous) => {
      const existing = previous.get(passage.sequence);
      if (
        existing &&
        existing.verses === passage.verses &&
        existing.reference === passage.reference &&
        existing.label === passage.label
      ) {
        return previous;
      }
      const next = new Map(previous);
      next.set(passage.sequence, passage);
      return next;
    });
  }, []);

  const activeSegment = activeIndex == null ? null : segments[activeIndex] ?? null;
  const activeVerseId = activeSegment?.verseId ?? null;
  const currentPassage = activeSegment ? passages.get(activeSegment.sequence) ?? null : null;

  // Phones, and some laptop browsers, silence the device voice when the page
  // leaves the screen, and often never fire the end of the verse that was
  // cut off, which left the reading stuck. Coming back picks it up again at
  // the same verse.
  useEffect(() => {
    const onVisible = () => {
      const synth = speech();
      if (document.visibilityState !== "visible" || !synth || statusRef.current !== "playing") return;
      if (synth.paused) synth.resume();
      window.setTimeout(() => {
        if (statusRef.current === "playing" && !synth.speaking && !synth.pending) startAt(indexRef.current);
      }, 300);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [startAt]);

  // Keep the verse being read on screen, without fighting a reader who has it
  // in view already.
  useEffect(() => {
    if (status !== "playing" || activeVerseId == null) return;
    const element = document.querySelector<HTMLElement>(`[data-verse-id="${activeVerseId}"]`);
    if (!element || typeof element.scrollIntoView !== "function") return;
    const { top, bottom } = element.getBoundingClientRect();
    if (top < 80 || bottom > window.innerHeight - 160) {
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [activeVerseId, status]);

  const value = useMemo<ReadAloudState>(
    () => ({
      supported,
      ready: passages.size >= expected && segments.length > 0,
      status,
      error,
      activeVerseId,
      current: currentPassage ? { reference: currentPassage.reference, label: currentPassage.label } : null,
      passageCount: passages.size,
      rate,
      voices,
      voiceURI,
      play,
      pause,
      stop,
      skip,
      setRate,
      setVoice,
    }),
    [supported, passages, expected, segments, status, error, activeVerseId, currentPassage, rate, voices, voiceURI, play, pause, stop, skip, setRate, setVoice],
  );

  return (
    <RegisterContext.Provider value={register}>
      <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
    </RegisterContext.Provider>
  );
}

/** Room at the foot of the page for the floating controls, while they show. */
export function ReadAloudSpacer() {
  const audio = useReadAloud();
  const active = audio?.status === "playing" || audio?.status === "paused";
  return active ? <div aria-hidden="true" className="h-24 sm:h-20" /> : null;
}
