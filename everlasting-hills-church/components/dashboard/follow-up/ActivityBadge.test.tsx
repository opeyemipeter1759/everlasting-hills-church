import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MasterListRow } from "@/lib/api/follow-up-pipeline";
import { ActivityBadge } from "./ActivityBadge";
import { MasterListTable } from "./MasterListTable";

afterEach(cleanup);

const row = (over: Partial<MasterListRow> = {}): MasterListRow => ({
  id: "m1",
  kind: "MEMBER",
  name: "Tunde Bello",
  photoUrl: null,
  assignedTo: { id: "a1", name: "Bola Ade" },
  status: "FIRST_TIMER" as MasterListRow["status"],
  hasAccount: true,
  attended: 1,
  ...over,
});

describe("ActivityBadge", () => {
  it("shows how many activities are logged and how many are new", () => {
    render(<ActivityBadge activity={{ total: 12, unread: 3 }} />);
    const badge = screen.getByLabelText("12 activities logged, 3 unread");
    expect(badge).toHaveTextContent("12");
    expect(badge).toHaveTextContent("3 new");
  });

  it("shows no new badge once everything has been read", () => {
    render(<ActivityBadge activity={{ total: 1, unread: 0 }} />);
    expect(screen.getByLabelText("1 activity logged")).not.toHaveTextContent("new");
  });

  it("says when there is no activity yet", () => {
    render(<ActivityBadge activity={undefined} />);
    expect(screen.getByLabelText("No activity yet")).toHaveTextContent("0");
  });
});

describe("Master list table", () => {
  it("has an Activity column with each person's count and unread messages", () => {
    render(
      <MasterListTable
        rows={[row({ activity: { total: 5, unread: 2 } }), row({ id: "m2", name: "Ada Obi", activity: { total: 0, unread: 0 } })]}
        isLoading={false}
        canEdit={false}
        onEdit={vi.fn()}
        onOpen={vi.fn()}
        selection={null}
      />,
    );
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "Activity" })).toBeInTheDocument();
    const tunde = within(table).getByRole("row", { name: /Tunde Bello/ });
    expect(within(tunde).getByLabelText("5 activities logged, 2 unread")).toBeInTheDocument();
    const ada = within(table).getByRole("row", { name: /Ada Obi/ });
    expect(within(ada).getByLabelText("No activity yet")).toBeInTheDocument();
  });
});
