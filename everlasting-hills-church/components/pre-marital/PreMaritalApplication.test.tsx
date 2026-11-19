import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PreMaritalApplication from "./PreMaritalApplication";

const post = vi.fn();
vi.mock("@/lib/api/request", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

const type = (label: RegExp, value: string, index = 0) => fireEvent.change(screen.getAllByLabelText(label)[index], { target: { value } });

function fillValid() {
  type(/^First name/, "Tunde", 0);
  type(/^Last name/, "Adeyemi", 0);
  type(/^Phone number/, "0803 123 4567", 0);
  type(/^Email address/, "tunde@example.com", 0);
  type(/^First name/, "Ada", 1);
  type(/^Last name/, "Eze", 1);
  type(/^Phone number/, "0809 765 4321", 1);
  type(/^Email address/, "ada@example.com", 1);
  fireEvent.click(screen.getAllByLabelText("Yes")[0]);
  fireEvent.click(screen.getAllByLabelText("No")[1]);
  fireEvent.click(screen.getByRole("checkbox"));
}
const send = () => fireEvent.click(screen.getByRole("button", { name: /send our application/i }));

beforeEach(() => post.mockReset());
afterEach(cleanup);

describe("the pre-marital counselling application form", () => {
  it("shows a clear problem under each missing answer and sends nothing", async () => {
    render(<PreMaritalApplication />);
    await act(async () => send());
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText("Enter the groom's first name")).toBeTruthy();
    expect(screen.getByText("Enter the bride's email address")).toBeTruthy();
    expect(screen.getByText("Say whether the bride is a member of Everlasting Hills")).toBeTruthy();
    expect(screen.getByText("Both of you need to agree to apply")).toBeTruthy();
  });

  it("saves first, then thanks them by name with the reference, and says it is not an appointment", async () => {
    post.mockResolvedValueOnce({ referenceCode: "PMC-7K4QH2", submittedAt: "2026-11-19T09:00:00Z" });
    render(<PreMaritalApplication />);
    fillValid();
    await act(async () => send());

    expect(post).toHaveBeenCalledTimes(1);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe("/pre-marital-counselling");
    expect(body).toMatchObject({ groomFirstName: "Tunde", groomIsMember: true, brideIsMember: false, consent: true, weddingDate: null });
    expect(body.submissionKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(screen.getByText("Thank you, Tunde and Ada")).toBeTruthy();
    expect(screen.getByText("PMC-7K4QH2")).toBeTruthy();
    expect(screen.getByText(/does not book a session/)).toBeTruthy();
  });

  it("puts the server's field problems under the right answers and keeps everything typed", async () => {
    post.mockRejectedValueOnce({ message: "Invalid input", status: 400, details: [{ path: "brideEmail", message: "Enter a valid email address" }] });
    render(<PreMaritalApplication />);
    fillValid();
    await act(async () => send());

    expect(screen.getByText("Enter a valid email address")).toBeTruthy();
    expect(screen.getByText("Please check the answers marked below.")).toBeTruthy();
    expect((screen.getAllByLabelText(/^First name/)[0] as HTMLInputElement).value).toBe("Tunde");
    expect((screen.getAllByLabelText(/^Email address/)[1] as HTMLInputElement).value).toBe("ada@example.com");
  });

  it("a retry after a failed send uses the same key, so the pastors get one application", async () => {
    post.mockRejectedValueOnce({ message: "Network Error" }).mockResolvedValueOnce({ referenceCode: "PMC-AAAAAA", submittedAt: "x" });
    render(<PreMaritalApplication />);
    fillValid();
    await act(async () => send());
    expect(screen.getByText(/did not go through/)).toBeTruthy();
    await act(async () => send());
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][1].submissionKey).toBe(post.mock.calls[0][1].submissionKey);
  });

  it("a double click while sending sends once", async () => {
    let finish: (v: unknown) => void = () => {};
    post.mockReturnValueOnce(new Promise((r) => (finish = r)));
    render(<PreMaritalApplication />);
    fillValid();
    await act(async () => {
      send();
      send();
    });
    expect(post).toHaveBeenCalledTimes(1);
    expect((screen.getByRole("button", { name: /sending/i }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => finish({ referenceCode: "PMC-BBBBBB", submittedAt: "x" }));
    expect(screen.getByText("PMC-BBBBBB")).toBeTruthy();
  });
});
