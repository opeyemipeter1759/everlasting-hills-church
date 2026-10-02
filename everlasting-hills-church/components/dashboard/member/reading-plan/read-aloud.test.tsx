import { useEffect } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { chooseOption } from "@/test/choose-option";
import { ChapterPassage } from "./ChapterPassage";
import { ListenBar } from "./ListenBar";
import {
  ReadAloudProvider,
  buildSegments,
  chunkVerse,
  preferredVoice,
  speakableText,
  spokenHeading,
  useRegisterPassage,
  type ReadAloudPassage,
} from "./read-aloud";

class FakeUtterance {
  text: string;
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  lang = "";
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

let spoken: FakeUtterance[];
let synth: {
  speaking: boolean;
  pending: boolean;
  speak: Mock;
  cancel: Mock;
  getVoices: Mock;
  addEventListener: Mock;
  removeEventListener: Mock;
};

function voice(name: string, lang: string, extra: Partial<SpeechSynthesisVoice> = {}) {
  return { name, lang, voiceURI: name, default: false, localService: true, ...extra } as SpeechSynthesisVoice;
}

function installSpeech(voices = [voice("Samantha", "en-US")]) {
  spoken = [];
  synth = {
    speaking: false,
    pending: false,
    speak: vi.fn((utterance: FakeUtterance) => {
      spoken.push(utterance);
      synth.speaking = true;
    }),
    cancel: vi.fn(() => {
      synth.speaking = false;
    }),
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true, writable: true });
  Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FakeUtterance, configurable: true, writable: true });
}

function removeSpeech() {
  const speechWindow = window as unknown as Record<string, unknown>;
  delete speechWindow.speechSynthesis;
  delete speechWindow.SpeechSynthesisUtterance;
}

/** Finish whatever is being said, as the browser would when the words run out. */
function finishSpeaking() {
  act(() => {
    synth.speaking = false;
    spoken[spoken.length - 1].onend?.();
  });
}

const lastSaid = () => spoken[spoken.length - 1]?.text;

const genesis: ReadAloudPassage = {
  sequence: 1,
  label: "Law",
  reference: "Genesis 1:1–2",
  verses: [
    { verseId: 1001001, book: "Genesis", chapter: 1, verse: 1, text: "In the beginning, God created the heavens and the earth." },
    { verseId: 1001002, book: "Genesis", chapter: 1, verse: 2, text: "The earth was formless and empty." },
  ],
};

const psalm: ReadAloudPassage = {
  sequence: 2,
  label: "Poetry and Wisdom",
  reference: "Psalm 23:1",
  verses: [{ verseId: 19023001, book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall lack nothing." }],
};

function Portion({ passage }: { passage: ReadAloudPassage }) {
  const register = useRegisterPassage();
  useEffect(() => {
    register?.(passage);
  }, [register, passage]);
  return <ChapterPassage verses={passage.verses} />;
}

function Day({ passages = [genesis, psalm] }: { passages?: ReadAloudPassage[] }) {
  return (
    <ReadAloudProvider expected={passages.length}>
      <ListenBar />
      {passages.map((passage) => (
        <Portion key={passage.sequence} passage={passage} />
      ))}
    </ReadAloudProvider>
  );
}

const speaking = () => document.querySelector("[data-speaking='true']")?.getAttribute("data-verse-id");

beforeEach(() => {
  window.localStorage.clear();
  installSpeech();
});

afterEach(() => {
  cleanup();
  removeSpeech();
});

describe("what gets read aloud", () => {
  it("announces books and chapters the way a reader would say them", () => {
    expect(spokenHeading("Genesis", 1)).toBe("Genesis, chapter 1.");
    expect(spokenHeading("1 Samuel", 3)).toBe("First Samuel, chapter 3.");
    expect(spokenHeading("3 John", 1)).toBe("Third John, chapter 1.");
    expect(spokenHeading("Psalms", 23)).toBe("Psalm 23.");
  });

  it("lowers divine names set in capitals so no voice spells them out", () => {
    expect(speakableText("The LORD GOD said, ¶  “Let there be light.”")).toBe("The Lord God said, “Let there be light.”");
    expect(speakableText("the LORD’s house")).toBe("the Lord’s house");
  });

  it("splits a long verse at its pauses and loses none of it", () => {
    const verse =
      "Then the king’s scribes were called at that time, in the third month Sivan, on the twenty-third day; and it was written according to all that Mordecai commanded to the Jews, and to the satraps, and the governors and princes of the provinces which are from India to Ethiopia, one hundred twenty-seven provinces.";
    const chunks = chunkVerse(verse);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(180);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toBe(verse);
  });

  it("reads the passages in the day's order, each chapter announced once", () => {
    expect(buildSegments([psalm, genesis]).map((segment) => segment.text)).toEqual([
      "Genesis, chapter 1.",
      "In the beginning, God created the heavens and the earth.",
      "The earth was formless and empty.",
      "Psalm 23.",
      "The Lord is my shepherd; I shall lack nothing.",
    ]);
  });

  it("keeps a member's chosen voice, otherwise prefers a natural English one", () => {
    const voices = [
      voice("Default", "en-US", { default: true }),
      voice("Microsoft Ezinne Online (Natural)", "en-NG"),
      voice("Daniel", "en-GB"),
    ];
    expect(preferredVoice(voices, null)?.name).toBe("Microsoft Ezinne Online (Natural)");
    expect(preferredVoice(voices, "Daniel")?.name).toBe("Daniel");
    expect(preferredVoice(voices, "a voice this device no longer has")?.name).toBe("Microsoft Ezinne Online (Natural)");
  });
});

describe("listening to the day's reading", () => {
  it("offers nothing where the browser cannot speak", () => {
    removeSpeech();
    render(<Day />);

    expect(screen.queryByRole("button", { name: "Listen" })).not.toBeInTheDocument();
  });

  it("reads every verse in turn, highlights the one being read, and says when it is done", async () => {
    render(<Day />);

    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    // Within the tap itself: iOS refuses speech that starts any later.
    expect(lastSaid()).toBe("Genesis, chapter 1.");
    expect(speaking()).toBe("1001001");
    expect(screen.getByRole("region", { name: "Audio controls" })).toHaveTextContent("Genesis 1:1–2");

    finishSpeaking();
    expect(lastSaid()).toBe("In the beginning, God created the heavens and the earth.");
    finishSpeaking();
    expect(lastSaid()).toBe("The earth was formless and empty.");
    expect(speaking()).toBe("1001002");
    finishSpeaking();
    expect(lastSaid()).toBe("Psalm 23.");
    finishSpeaking();
    expect(lastSaid()).toBe("The Lord is my shepherd; I shall lack nothing.");
    expect(speaking()).toBe("19023001");
    finishSpeaking();

    expect(screen.getByText(/Finished\. Mark today as read below/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Listen again" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Audio controls" })).not.toBeInTheDocument();
    expect(speaking()).toBeUndefined();
  });

  it("pauses without moving on, and resumes from the same verse", async () => {
    render(<Day />);
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    await waitFor(() => expect(lastSaid()).toBe("Genesis, chapter 1."));
    finishSpeaking();

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(synth.cancel).toHaveBeenCalled();
    expect(screen.getByText("Paused at Genesis 1:1–2")).toBeInTheDocument();
    // Some browsers end a cancelled utterance; that must not advance the reading.
    const said = spoken.length;
    act(() => spoken[said - 1].onend?.());
    expect(spoken).toHaveLength(said);

    fireEvent.click(screen.getByRole("button", { name: "Resume listening" }));
    await waitFor(() => expect(spoken).toHaveLength(said + 1));
    expect(lastSaid()).toBe("In the beginning, God created the heavens and the earth.");
  });

  it("skips to the next passage", async () => {
    render(<Day />);
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    await waitFor(() => expect(lastSaid()).toBe("Genesis, chapter 1."));

    fireEvent.click(screen.getByRole("button", { name: "Next passage" }));

    await waitFor(() => expect(lastSaid()).toBe("Psalm 23."));
    expect(screen.getByRole("region", { name: "Audio controls" })).toHaveTextContent("Poetry and Wisdom");
  });

  it("applies a new speed at once and remembers it on this device", async () => {
    render(<Day />);
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    await waitFor(() => expect(spoken).toHaveLength(1));

    chooseOption("Reading speed", "1.25×");

    await waitFor(() => expect(spoken).toHaveLength(2));
    expect(spoken[1]).toMatchObject({ text: "Genesis, chapter 1.", rate: 1.25 });
    expect(window.localStorage.getItem("ehc.read-aloud.rate")).toBe("1.25");
  });

  it("stops speaking when the reading is closed", async () => {
    const { unmount } = render(<Day />);
    fireEvent.click(screen.getByRole("button", { name: "Listen" }));
    await waitFor(() => expect(spoken).toHaveLength(1));
    synth.cancel.mockClear();

    unmount();

    expect(synth.cancel).toHaveBeenCalled();
  });
});
