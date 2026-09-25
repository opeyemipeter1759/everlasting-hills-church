import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CreateAccountBtn from "./CreateAccountBtn";
import type { VisitorRow } from "./types";

const apiPost = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("@/lib/api/axios", () => ({ apiClient: { post: apiPost } }));
vi.mock("@/components/ui/toast/toast", () => ({ showToast: toast }));

const visitor: VisitorRow = {
  id: "visitor-moronfolu",
  firstName: "Kehinde",
  lastName: "Moronfolu",
  email: "kehinde@example.com",
  phone: "08012345678",
  gender: null,
  attendanceType: "Online",
  membershipInterest: "Yes",
  howDidYouLearn: null,
  locatedInIbadan: null,
  bornAgain: null,
  occupation: null,
  submittedAt: "2026-09-20T09:00:00.000Z",
  hasOnlineCheckIn: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  apiPost.mockResolvedValue({ data: {} });
});

afterEach(cleanup);

describe("CreateAccountBtn", () => {
  it("lets an admin override the second-visit wait after confirming", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    render(<CreateAccountBtn visitor={visitor} onCreated={onCreated} />);

    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(apiPost).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Kehinde Moronfolu");
    expect(screen.getByText(/no second online visit is recorded/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Create Account" }));

    await waitFor(() =>
      expect(apiPost).toHaveBeenCalledWith("/members/convert-visitor/visitor-moronfolu"),
    );
    expect(onCreated).toHaveBeenCalledWith("visitor-moronfolu");
    expect(toast.success).toHaveBeenCalledWith("Kehinde Moronfolu is now a member");
  });

  it("creates an eligible account without the override confirmation", async () => {
    const user = userEvent.setup();
    render(
      <CreateAccountBtn
        visitor={{ ...visitor, hasOnlineCheckIn: true }}
        onCreated={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("still requires contact details before an account can be created", () => {
    render(
      <CreateAccountBtn
        visitor={{ ...visitor, email: null }}
        onCreated={vi.fn()}
      />,
    );

    expect(screen.getByText("No email/phone")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /create/i })).not.toBeInTheDocument();
  });
});
