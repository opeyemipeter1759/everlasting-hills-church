import { useEffect } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import manifestFile from "@/lib/bible-audio/web-chapters.json";
import { chapterAudioUrl, hasRecording, verseChapter } from "@/lib/bible-audio";
import { ListenBar } from "./ListenBar";
import { useRegisterPassage, type ReadAloudPassage } from "./read-aloud";
import { RecordedAudioProvider, buildTracks } from "./recorded-audio";

const manifest = {
  "1": ["https://audio.test/gen1.mp3", "https://audio.test/gen2.mp3"],
  "19": Array.from({ length: 150 }, (_, i) => `https://audio.test/ps${i + 1}.mp3`),
};

vi.mock("@/lib/bible-audio", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/bible-audio")>()),
  loadChapterManifest: vi.fn(async () => manifest),
}));

const genesis: ReadAloudPassage = {
  sequence: 1,
  label: "Law",
  reference: "Genesis 1–2",
  verses: [
    { verseId: 1001001, book: "Genesis", chapter: 1, verse: 1, text: "In the beginning." },
    { verseId: 1001031, book: "Genesis", chapter: 1, verse: 31, text: "It was very good." },
    { verseId: 1002001, book: "Genesis", chapter: 2, verse: 1, text: "The heavens were finished." },
  ],
};

const psalm: ReadAloudPassage = {
  sequence: 2,
  label: "Poetry and Wisdom",
  reference: "Psalm 23",
  verses: [{ verseId: 19023001, book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd." }],
};

function Portion({ passage }: { passage: ReadAloudPassage }) {
  const register = useRegisterPassage();
  useEffect(() => {
    register?.(passage);
  }, [register, passage]);
  return null;
}

function Day() {
  return (
    <RecordedAudioProvider expected={2} planTitle="Bible in 4 months">
      <ListenBar />
      <Portion passage={psalm} />
      <Portion passage={genesis} />
    </RecordedAudioProvider>
  );
}

let play: ReturnType<typeof vi.fn<() => Promise<void>>>;
let pause: ReturnType<typeof vi.fn<() => void>>;

beforeEach(() => {
  window.localStorage.clear();
  play = vi.fn<() => Promise<void>>(() => Promise.resolve());
  pause = vi.fn<() => void>();
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause);
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const audioElement = () => document.querySelector("audio") as HTMLAudioElement;

describe("the chapter recordings", () => {
  it("covers every chapter of the Bible", () => {
    const chapters = Object.values(manifestFile as Record<string, string[]>);
    expect(chapters).toHaveLength(66);
    expect(chapters.reduce((sum, list) => sum + list.length, 0)).toBe(1189);
    expect(chapterAudioUrl(manifestFile, 19, 119)).toMatch(/^https:\/\/ebible\.org\/eng-web\/audio\/19_/);
  });

  it("is offered for the World English Bible only", () => {
    expect(hasRecording("WEB")).toBe(true);
    expect(hasRecording("web")).toBe(true);
    expect(hasRecording("KJV")).toBe(false);
    expect(hasRecording(undefined)).toBe(false);
  });

  it("reads the book and chapter from a verse id", () => {
    expect(verseChapter(19119176)).toEqual({ bookId: 19, chapter: 119 });
  });

  it("plays each chapter of the day once, in reading order", () => {
    expect(buildTracks([psalm, genesis], manifest).map((track) => [track.title, track.url, track.label])).toEqual([
      ["Genesis 1", "https://audio.test/gen1.mp3", "Law"],
      ["Genesis 2", "https://audio.test/gen2.mp3", "Law"],
      ["Psalm 23", "https://audio.test/ps23.mp3", "Poetry and Wisdom"],
    ]);
  });
});

describe("listening to a recording", () => {
  it("plays the chapters one after another and credits the reader", async () => {
    render(<Day />);
    const listen = await screen.findByRole("button", { name: "Listen" });
    await waitFor(() => expect(listen).toBeEnabled());
    expect(screen.getByText(/Winfred W\. Henson/)).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Voice" })).not.toBeInTheDocument();

    fireEvent.click(listen);
    expect(play).toHaveBeenCalledTimes(1);
    expect(audioElement().src).toBe("https://audio.test/gen1.mp3");
    expect(screen.getByRole("region", { name: "Audio controls" })).toHaveTextContent("Genesis 1");

    act(() => {
      audioElement().dispatchEvent(new Event("ended"));
    });
    expect(audioElement().src).toBe("https://audio.test/gen2.mp3");
    expect(play).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Next chapter" }));
    expect(audioElement().src).toBe("https://audio.test/ps23.mp3");

    act(() => {
      audioElement().dispatchEvent(new Event("ended"));
    });
    expect(screen.getByRole("button", { name: "Listen again" })).toBeInTheDocument();
  });

  it("pauses and carries on from the same place", async () => {
    render(<Day />);
    const listen = await screen.findByRole("button", { name: "Listen" });
    await waitFor(() => expect(listen).toBeEnabled());
    fireEvent.click(listen);

    fireEvent.click(screen.getByRole("button", { name: "Pause listening" }));
    expect(pause).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Resume listening" }));
    expect(play).toHaveBeenCalledTimes(2);
    expect(audioElement().src).toBe("https://audio.test/gen1.mp3");
  });

  it("says so when the recording cannot load", async () => {
    render(<Day />);
    const listen = await screen.findByRole("button", { name: "Listen" });
    await waitFor(() => expect(listen).toBeEnabled());
    fireEvent.click(listen);
    act(() => {
      audioElement().dispatchEvent(new Event("error"));
    });
    expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");
  });
});
