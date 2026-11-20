import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PremaritalForm from "./PremaritalForm";

const post = vi.fn();
vi.mock("@/lib/api/request", () => ({ api: { post: (...a: unknown[]) => post(...a) } }));

const type = (id: string, value: string) => fireEvent.change(document.getElementById(id)!, { target: { value } });
function fillValid() {
  fireEvent.click(screen.getByLabelText("Intending groom"));
  type("pmc-applicantFirstName", "Tunde");
  type("pmc-applicantLastName", "Adeyemi");
  type("pmc-applicantEmail", "tunde@example.com");
  type("pmc-applicantPhone", "0803 123 4567");
  type("pmc-partnerFirstName", "Ada");
  type("pmc-partnerLastName", "Eze");
  type("pmc-partnerPhone", "0809 765 4321");
  fireEvent.click(screen.getByLabelText(/knows I am applying/));
  fireEvent.click(screen.getByLabelText("One of us is a member"));
  fireEvent.click(screen.getByLabelText("WhatsApp"));
  fireEvent.click(screen.getByLabelText(/I agree to the church/));
}
const send = () => fireEvent.click(screen.getByRole("button", { name: /send my application/i }));
const form = () => render(<PremaritalForm />);

beforeEach(() => post.mockReset());
afterEach(cleanup);

describe("the pre-marital counselling form", () => {
  it("shows a clear problem under each missing answer and sends nothing", async () => {
    form();
    await act(async () => send());
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText("Enter your first name")).toBeTruthy();
    expect(screen.getByText("Give a phone number or email address for your partner")).toBeTruthy();
    expect(screen.getByText("Confirm your partner is happy for us to contact them")).toBeTruthy();
    expect(screen.getByText("Please accept the privacy policy")).toBeTruthy();
  });

  it("saves first, then thanks them by name with the reference, and says it is not an appointment", async () => {
    post.mockResolvedValueOnce({ referenceCode: "PMC-7K4QH2" });
    form();
    fillValid();
    await act(async () => send());
    const [url, body] = post.mock.calls[0];
    expect(url).toBe("/public/premarital/applications");
    expect(body).toMatchObject({ applicantRole: "GROOM", applicantFirstName: "Tunde", partnerEmail: null, membership: "ONE_MEMBER", preferredContact: "WHATSAPP", website: "" });
    expect(screen.getByText("Thank you, Tunde and Ada")).toBeTruthy();
    expect(screen.getByText("PMC-7K4QH2")).toBeTruthy();
    expect(screen.getByText(/does not book a session/)).toBeTruthy();
  });

  it("puts the server's problems under the right answers and keeps everything typed", async () => {
    post.mockRejectedValueOnce({ status: 400, message: "Invalid input", details: [{ path: "applicantEmail", message: "Enter a valid email address" }] });
    form();
    fillValid();
    await act(async () => send());
    expect(screen.getByText("Enter a valid email address")).toBeTruthy();
    expect((document.getElementById("pmc-applicantFirstName") as HTMLInputElement).value).toBe("Tunde");
  });

  it("a retry uses the same key, and a double click sends once", async () => {
    let finish: (v: unknown) => void = () => {};
    post.mockRejectedValueOnce({ message: "Network Error" }).mockReturnValueOnce(new Promise((r) => (finish = r)));
    form();
    fillValid();
    await act(async () => send());
    expect(screen.getByText(/did not go through/)).toBeTruthy();
    await act(async () => {
      send();
      send();
    });
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][1].submissionKey).toBe(post.mock.calls[0][1].submissionKey);
    await act(async () => finish({ referenceCode: "PMC-AAAAAA" }));
    expect(screen.getByText("PMC-AAAAAA")).toBeTruthy();
  });

  it("can be filled in and sent with the keyboard alone", async () => {
    post.mockResolvedValueOnce({ referenceCode: "PMC-KEYBRD" });
    const user = userEvent.setup();
    form();
    await user.tab();
    await user.keyboard(" "); // I am the: intending groom
    await user.tab();
    expect(document.activeElement?.id).toBe("pmc-applicantFirstName");
    await user.keyboard("Tunde");
    for (const [text] of [["Adeyemi"], ["tunde@example.com"], ["0803 123 4567"], ["Ada"], ["Eze"], ["0809 765 4321"]]) {
      await user.tab();
      await user.keyboard(text);
    }
    await user.tab(); // partner email: leave blank
    await user.tab();
    await user.keyboard(" "); // partner consent
    await user.tab();
    await user.keyboard("{ArrowDown}"); // membership: arrow keys move within the group
    await user.tab(); // wedding date
    await user.tab();
    await user.keyboard(" "); // preferred contact: first option
    await user.tab(); // intro
    await user.tab();
    await user.keyboard(" "); // privacy
    await user.tab(); // the Privacy Policy link
    await user.tab();
    await user.keyboard("{Enter}");
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][1]).toMatchObject({ applicantRole: "GROOM", applicantFirstName: "Tunde", partnerConsentToContact: true, privacyAcknowledged: true });
  });

  it("asks who is applying, then names the other person by it", () => {
    form();
    send();
    expect(screen.getByText("Tell us whether you are the intending groom or the intending bride")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Intending bride"));
    expect(screen.getByText("The intending groom")).toBeTruthy();
    expect(screen.getByLabelText(/He knows I am applying/)).toBeTruthy();
  });

  it("hides the bot trap from people and screen readers", () => {
    form();
    expect(document.getElementById("pmc-website")?.closest("[aria-hidden=true]")).toBeTruthy();
    expect(document.getElementById("pmc-website")?.getAttribute("tabindex")).toBe("-1");
  });
});
