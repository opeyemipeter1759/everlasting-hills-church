import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { showToast } from "@/components/ui/toast/toast";
import { PlanLinkField, SharePlanLinkButton } from "./SharePlanLinkButton";

vi.mock("@/components/ui/toast/toast", () => ({ showToast: { success: vi.fn(), error: vi.fn() } }));

const plan = { slug: "bible-in-four-months", title: "The Bible in four months", subtitle: "Six readings a day." };
const link = () => `${window.location.origin}/dashboard/reading/plans?plan=bible-in-four-months`;

let share: Mock;
let writeText: Mock;

/** A phone has a share sheet and a touch screen; a computer is given neither here. */
function onDevice({ phone, shareResult }: { phone: boolean; shareResult?: Promise<void> }) {
  share = vi.fn(() => shareResult ?? Promise.resolve());
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "share", { value: phone ? share : undefined, configurable: true, writable: true });
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true, writable: true });
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: phone && query === "(pointer: coarse)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("sending a plan as a link", () => {
  it("opens the phone's share sheet with the plan's link", async () => {
    onDevice({ phone: true });
    render(<SharePlanLinkButton plan={plan} />);

    fireEvent.click(screen.getByRole("button", { name: "Send a link to The Bible in four months" }));

    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: "The Bible in four months",
      text: "The Bible in four months: Six readings a day.",
      url: link(),
    }));
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the link on a computer, to paste into WhatsApp or an email", async () => {
    onDevice({ phone: false });
    render(<SharePlanLinkButton plan={plan} />);

    fireEvent.click(screen.getByRole("button", { name: "Send a link to The Bible in four months" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(link()));
    expect(showToast.success).toHaveBeenCalledWith("Link copied. Paste it into WhatsApp, a text or an email.");
  });

  it("does nothing more when the share sheet is closed", async () => {
    onDevice({ phone: true, shareResult: Promise.reject(Object.assign(new Error("Share canceled"), { name: "AbortError" })) });
    render(<SharePlanLinkButton plan={plan} />);

    fireEvent.click(screen.getByRole("button", { name: "Send a link to The Bible in four months" }));

    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(writeText).not.toHaveBeenCalled();
    expect(showToast.error).not.toHaveBeenCalled();
  });

  it("falls back to copying when the share sheet fails", async () => {
    onDevice({ phone: true, shareResult: Promise.reject(Object.assign(new Error("Not allowed"), { name: "NotAllowedError" })) });
    render(<SharePlanLinkButton plan={plan} />);

    fireEvent.click(screen.getByRole("button", { name: "Send a link to The Bible in four months" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(link()));
  });

  it("shows the whole link for a group chat, and copies it", async () => {
    onDevice({ phone: false });
    render(<PlanLinkField plan={plan} />);

    expect(screen.getByLabelText("Plan link")).toHaveValue(link());
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(link()));
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
  });
});
