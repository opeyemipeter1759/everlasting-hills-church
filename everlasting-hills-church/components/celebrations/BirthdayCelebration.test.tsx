import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import BirthdayCelebration from "./BirthdayCelebration";
import { useMe } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const motionPreference = vi.hoisted(() => ({ reduced: false }));
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useReducedMotion: () => motionPreference.reduced,
}));
vi.mock("@/lib/api", () => ({ useMe: vi.fn() }));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: vi.fn() }));

// 14 September 2026, mid-morning in Lagos.
const TODAY = new Date("2026-09-14T10:00:00Z");
const BIRTHDAY = "1995-09-14T00:00:00.000Z";

function signedIn(dateOfBirth: string | null) {
  vi.mocked(useCurrentUser).mockReturnValue({ loggedIn: true } as never);
  vi.mocked(useMe).mockReturnValue({
    data: { member: { id: "member-1", firstName: "Tomike", dateOfBirth } },
  } as never);
}

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(TODAY);
  window.localStorage.clear();
  motionPreference.reduced = false;
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("BirthdayCelebration", () => {
  it("greets the member by name with balloons and bubbles on their birthday", () => {
    signedIn(BIRTHDAY);
    render(<BirthdayCelebration />);

    expect(screen.getByRole("dialog", { name: "Happy birthday, Tomike!" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Pop balloon" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Pop bubble" }).length).toBeGreaterThan(0);
  });

  it("stays quiet on any other day", () => {
    signedIn("1995-09-15T00:00:00.000Z");
    render(<BirthdayCelebration />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does nothing, and asks for nothing, for someone who is not signed in", () => {
    vi.mocked(useCurrentUser).mockReturnValue(null);
    vi.mocked(useMe).mockReturnValue({ data: undefined } as never);
    render(<BirthdayCelebration />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useMe).toHaveBeenCalledWith({ enabled: false });
  });

  it("plays once a day, not on every page", () => {
    signedIn(BIRTHDAY);
    const first = render(<BirthdayCelebration />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    first.unmount();

    render(<BirthdayCelebration />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes with Thank you", async () => {
    signedIn(BIRTHDAY);
    render(<BirthdayCelebration />);

    fireEvent.click(screen.getByRole("button", { name: "Thank you!" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes with Escape", async () => {
    signedIn(BIRTHDAY);
    render(<BirthdayCelebration />);

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("pops a balloon when it is tapped", () => {
    signedIn(BIRTHDAY);
    render(<BirthdayCelebration />);

    const [balloon] = screen.getAllByRole("button", { name: "Pop balloon" });
    fireEvent.click(balloon);

    expect(balloon).toHaveAttribute("data-popped", "true");
    expect(balloon).toBeDisabled();
  });

  it("keeps the greeting but lets nothing fly for reduced motion", () => {
    motionPreference.reduced = true;
    signedIn(BIRTHDAY);
    render(<BirthdayCelebration />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pop balloon" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pop bubble" })).not.toBeInTheDocument();
  });
});
