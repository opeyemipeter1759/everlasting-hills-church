import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TestimoniesAdminClient from "./TestimoniesAdminClient";

const markRead = vi.fn();
const base = {
  authorRole: null,
  authorPhotoUrl: null,
  submitterContact: null,
  isAnonymous: false,
  sharePhysically: null,
  member: null,
  published: false,
  publishedAt: null,
  order: 0,
  createdAt: "2026-09-27T09:00:00.000Z",
  updatedAt: "2026-09-27T09:00:00.000Z",
};
const rows = [
  { ...base, id: "t1", authorName: "Ada", content: "God healed me", readAt: null, readByName: null },
  { ...base, id: "t2", authorName: "Tunde", content: "New job", readAt: "2026-09-27T10:00:00.000Z", readByName: "Bola Ade" },
];

vi.mock("@/lib/api/testimonials", () => ({
  useAdminTestimonials: () => ({ data: rows, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() }),
  useDeleteTestimonial: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useTogglePublishTestimonial: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMarkTestimonialRead: () => ({ mutate: markRead, isPending: false }),
}));
vi.mock("@/hooks/useCurrentUser", () => ({ useCurrentUser: () => ({ role: "ADMIN" }) }));
vi.mock("@/components/dashboard/admin/departments/HeadPicker", () => ({ Avatar: () => null }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("Testimonies Unread / Read", () => {
  it("opens on Unread, with a count on each tab", () => {
    render(<TestimoniesAdminClient />);
    expect(screen.getByRole("tab", { name: /Unread\s*1/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /^Read\s*1/ })).toBeInTheDocument();
    expect(screen.getByText("God healed me")).toBeInTheDocument();
    expect(screen.queryByText("New job")).not.toBeInTheDocument();
  });

  it("marks one read, which moves it to the Read tab", () => {
    render(<TestimoniesAdminClient />);
    fireEvent.click(screen.getByRole("button", { name: /Mark as read/ }));
    expect(markRead).toHaveBeenCalledWith({ id: "t1", read: true }, expect.anything());
  });

  it("shows who read it on the Read tab, and can put it back", () => {
    render(<TestimoniesAdminClient />);
    fireEvent.click(screen.getByRole("tab", { name: /^Read/ }));
    expect(screen.getByText("New job")).toBeInTheDocument();
    expect(screen.getByText(/Read by Bola Ade/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mark as unread/ }));
    expect(markRead).toHaveBeenCalledWith({ id: "t2", read: false }, expect.anything());
  });
});
