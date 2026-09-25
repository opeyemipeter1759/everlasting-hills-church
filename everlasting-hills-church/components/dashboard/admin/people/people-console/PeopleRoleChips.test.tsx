import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PeopleRoleChips from "./PeopleRoleChips";
import type { DirectoryMeta, DirectoryParams } from "@/lib/api/people";

const counts: DirectoryMeta["counts"] = {
  total: 120,
  active: 120,
  withUnit: 80,
  thisMonth: 4,
  deactivated: 7,
  byRole: { MEMBER: 120, PASTOR: 2, ADMIN_HEAD: 1, HOD: 3, HEAD_USHER: 1, UNIT_LEAD: 5 },
};

const params = (over: Partial<DirectoryParams> = {}) =>
  ({ page: 1, limit: 50, role: "", status: "", hasUnit: "", ...over }) as DirectoryParams;

afterEach(cleanup);

describe("PeopleRoleChips", () => {
  it("shows the deactivated feed's own size, apart from the membership", () => {
    render(<PeopleRoleChips params={params()} counts={counts} onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: /deactivated/i })).toHaveTextContent("7");
    // The membership total must not fold the deactivated back in.
    expect(screen.getByRole("button", { name: /^all/i })).toHaveTextContent("120");
  });

  it("asks for the deactivated feed by status, not by role", async () => {
    const onSelect = vi.fn();
    render(<PeopleRoleChips params={params()} counts={counts} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /deactivated/i }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ key: "deactivated" }));
  });

  // Inside the feed, "All" must not also look selected — the two are different
  // lists, not a filter layered over one.
  it("marks only the deactivated chip active while viewing that feed", () => {
    render(
      <PeopleRoleChips params={params({ status: "INACTIVE" })} counts={counts} onSelect={vi.fn()} />,
    );

    const deactivated = screen.getByRole("button", { name: /deactivated/i });
    const all = screen.getByRole("button", { name: /^all/i });
    expect(deactivated.className).toContain("bg-[#87102C]");
    expect(all.className).not.toContain("bg-[#87102C]");
  });
});
