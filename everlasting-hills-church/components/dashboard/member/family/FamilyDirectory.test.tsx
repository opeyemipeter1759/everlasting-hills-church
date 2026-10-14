import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FamilyDirectory from "./FamilyDirectory";

const nav = vi.hoisted(() => ({ params: new URLSearchParams(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/dashboard/family",
  useSearchParams: () => nav.params,
}));
const directory = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/family", () => ({ useFamilyDirectory: directory }));

const people = (n: number, from = 0) =>
  Array.from({ length: n }, (_, i) => ({ id: `m${from + i}`, firstName: `Member`, lastName: `${from + i}`, photoUrl: null, units: [] }));

beforeEach(() => {
  nav.params = new URLSearchParams();
  nav.replace.mockReset();
  directory.mockImplementation((_q: string, page: number) => ({
    data: { items: people(24, (page - 1) * 24), total: 81, page, pageSize: 24 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }));
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("the church family directory", () => {
  it("numbers its pages and says which members are showing", () => {
    nav.params = new URLSearchParams("page=2");
    render(<FamilyDirectory />);
    expect(directory).toHaveBeenCalledWith("", 2);
    expect(screen.getByText("Showing 25–48 of 81 members")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Page 4" })).toBeInTheDocument();
  });

  it("keeps the page in the address, so Back returns to it", () => {
    render(<FamilyDirectory />);
    fireEvent.click(screen.getByRole("button", { name: "Page 3" }));
    expect(nav.replace).toHaveBeenCalledWith("/dashboard/family?page=3", { scroll: false });
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(nav.replace).toHaveBeenLastCalledWith("/dashboard/family?page=2", { scroll: false });
  });

  it("searches from the first page", async () => {
    nav.params = new URLSearchParams("page=3");
    render(<FamilyDirectory />);
    fireEvent.change(screen.getByLabelText("Search members by name"), { target: { value: "ada" } });
    await new Promise((r) => setTimeout(r, 350));
    expect(nav.replace).toHaveBeenCalledWith("/dashboard/family?q=ada", { scroll: false });
  });
});
