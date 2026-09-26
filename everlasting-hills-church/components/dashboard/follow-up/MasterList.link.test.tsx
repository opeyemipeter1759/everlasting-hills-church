import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MasterList from "./MasterList";

const replace = vi.fn();
let search = "thread=MEMBER%3Am1";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard/membership-assimilation/unit-fu",
}));

const personHook = vi.fn();
vi.mock("@/lib/api/follow-up-pipeline", () => ({
  LATEST_SERVICE: "latest",
  useFollowUpMasterList: () => ({ data: { data: [], meta: { total: 0, take: 25, skip: 0, absent: 0, absenceServiceId: null } }, isLoading: false, isFetching: false }),
  useFollowUpPerson: (p: unknown) => personHook(p),
}));

// The drawer and the rest of the page are covered elsewhere: here, just who opens.
vi.mock("./PersonDrawer", () => ({
  PersonDrawer: ({ person }: { person: { name: string } | null }) => (person ? <div role="dialog">{person.name}</div> : null),
}));
vi.mock("./MasterListFilters", () => ({ MasterListFilters: () => null }));
vi.mock("./BulkStatusBar", () => ({ BulkStatusBar: () => null }));
vi.mock("./useMasterListEditing", () => ({ useMasterListEditing: () => ({ canEdit: false, open: vi.fn(), visitor: null, close: vi.fn(), saved: vi.fn() }) }));
vi.mock("./useFollowUpLeadership", () => ({ useFollowUpLeadership: () => ({ canRunUnit: false }) }));
vi.mock("@/components/dashboard/admin/FirstTimer/EditVisitorModal", () => ({ default: () => null }));

const TUNDE = {
  id: "m1",
  kind: "MEMBER",
  name: "Tunde Bello",
  photoUrl: null,
  assignedTo: null,
  status: "FIRST_TIMER",
  hasAccount: true,
  attended: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  search = "thread=MEMBER%3Am1";
  personHook.mockImplementation((p) => ({ data: p ? TUNDE : undefined }));
});
afterEach(cleanup);

describe("MasterList opened from a new-activity alert", () => {
  it("opens that person's conversation straight away, then tidies the address", async () => {
    render(<MasterList fixed={{ scope: "FOLLOW_UP" }} />);
    expect(await screen.findByRole("dialog")).toHaveTextContent("Tunde Bello");
    expect(personHook).toHaveBeenCalledWith({ kind: "MEMBER", id: "m1" });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard/membership-assimilation/unit-fu", { scroll: false }));
  });

  it("leaves it to the main list: the Assigned to me tab doesn't open a second drawer", () => {
    render(<MasterList fixed={{ scope: "FOLLOW_UP" }} showFilters={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(personHook).toHaveBeenCalledWith(null);
  });

  it("ignores anything that isn't a thread link", () => {
    search = "thread=nonsense";
    render(<MasterList fixed={{ scope: "FOLLOW_UP" }} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
