import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MySpouse } from "@/lib/api/family";
import { SpouseLink, SpouseRequestsInbox } from "./SpouseLink";

const state = vi.hoisted(() => ({ data: undefined as MySpouse | undefined }));
const request = vi.hoisted(() => vi.fn());
const cancel = vi.hoisted(() => vi.fn());
const respond = vi.hoisted(() => vi.fn());
const unlink = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/family", () => ({
  useMySpouse: () => ({ data: state.data, isLoading: false }),
  useRequestSpouse: () => ({ mutateAsync: request, isPending: false }),
  useCancelSpouseRequest: () => ({ mutateAsync: cancel, isPending: false }),
  useRespondToSpouse: () => ({ mutateAsync: respond, isPending: false }),
  useUnlinkSpouse: () => ({ mutateAsync: unlink, isPending: false }),
}));
vi.mock("@/lib/api", () => ({
  useMemberSearch: (q: string) => ({
    data: q.length >= 2 ? [{ id: "bayo", firstName: "Bayo", lastName: "Obi", photoUrl: null }] : undefined,
    isFetching: false,
  }),
}));
vi.mock("@/components/ui/form/Combobox", () => ({
  Combobox: ({ options, value, onChange, onQueryChange }: {
    options: { id: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    onQueryChange?: (q: string) => void;
  }) => (
    <>
      <input aria-label="Search names" onChange={(e) => onQueryChange?.(e.target.value)} />
      <select aria-label="Spouse" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  ),
}));

const nobody: MySpouse = { maritalStatus: "MARRIED", spouse: null, spouseName: null, pendingSent: null, pendingReceived: [] };
const bayo = { id: "bayo", name: "Bayo Obi", photoUrl: null };

beforeEach(() => {
  state.data = nobody;
  for (const fn of [request, cancel, respond, unlink]) fn.mockReset().mockResolvedValue(nobody);
});
afterEach(cleanup);

describe("linking a spouse who is a member", () => {
  it("finds them by name and sends them a request", async () => {
    render(<SpouseLink selfId="ada" />);
    fireEvent.change(screen.getByLabelText("Search names"), { target: { value: "Bay" } });
    const option = await screen.findByRole("option", { name: "Bayo Obi" });
    fireEvent.change(screen.getByLabelText("Spouse"), { target: { value: option.getAttribute("value") } });
    fireEvent.click(screen.getByRole("button", { name: /Send request/ }));
    await waitFor(() => expect(request).toHaveBeenCalledWith("bayo"));
  });

  it("shows the wait, and nothing confirmed, until they accept", () => {
    state.data = { ...nobody, pendingSent: { id: "r1", createdAt: "2026-10-11", to: bayo } };
    render(<SpouseLink selfId="ada" />);
    expect(screen.getByText(/Waiting for them to confirm/)).toBeInTheDocument();
    expect(screen.queryByText(/Married to/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Withdraw" }));
    expect(cancel).toHaveBeenCalled();
  });

  it("shows the confirmed spouse, and removes the link only after confirming", async () => {
    state.data = { ...nobody, spouse: bayo };
    render(<SpouseLink selfId="ada" />);
    expect(screen.getByRole("link", { name: "Bayo Obi" })).toHaveAttribute("href", "/dashboard/family/bayo");
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(unlink).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remove link" }));
    await waitFor(() => expect(unlink).toHaveBeenCalled());
  });
});

describe("a request to be someone's spouse", () => {
  it("can be confirmed or declined", () => {
    state.data = { ...nobody, pendingReceived: [{ id: "r1", createdAt: "2026-10-11", from: bayo }] };
    render(<SpouseRequestsInbox />);
    expect(screen.getByText(/listed you as their spouse/)).toHaveTextContent("Bayo Obi");
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(respond).toHaveBeenCalledWith({ id: "r1", accept: true });
    fireEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(respond).toHaveBeenCalledWith({ id: "r1", accept: false });
  });

  it("shows nothing when there is no request", () => {
    const { container } = render(<SpouseRequestsInbox />);
    expect(container).toBeEmptyDOMElement();
  });
});
