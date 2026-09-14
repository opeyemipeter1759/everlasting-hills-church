import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BeforeInstallPromptEvent } from "@/lib/pwa/install-state";
import InstallPrompt from "./InstallPrompt";

const originalUserAgent = navigator.userAgent;

function setUserAgent(value: string) {
  Object.defineProperty(window.navigator, "userAgent", {
    configurable: true,
    value,
  });
}

describe("InstallPrompt", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    setUserAgent(originalUserAgent);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((media: string) => ({
        matches: false,
        media,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    setUserAgent(originalUserAgent);
  });

  it("offers Chromium's native install prompt when the browser makes it available", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt") as BeforeInstallPromptEvent;
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: "accepted" });

    render(<InstallPrompt />);
    fireEvent(window, event);
    act(() => vi.advanceTimersByTime(2500));

    expect(
      screen.getByRole("dialog", { name: "Install Everlasting Hills Church" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Install" }));
    expect(prompt).toHaveBeenCalledOnce();
    await act(async () => event.userChoice);
  });

  it("shows Add to Home Screen instructions in third-party iOS browsers", () => {
    setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130 Mobile/15E148 Safari/604.1",
    );

    render(<InstallPrompt />);
    act(() => vi.advanceTimersByTime(2500));

    expect(
      screen.getByRole("dialog", { name: "Install Everlasting Hills Church" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show me how" }));
    expect(screen.getByText("Add to Home Screen")).toBeInTheDocument();
    expect(screen.getByText(/browser toolbar/)).toBeInTheDocument();
  });
});
