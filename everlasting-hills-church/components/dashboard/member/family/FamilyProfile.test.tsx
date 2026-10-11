import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FamilyProfile as Profile } from "@/lib/api/family";
import FamilyProfile from "./FamilyProfile";

const state = vi.hoisted(() => ({ data: undefined as Profile | undefined }));
vi.mock("@/lib/api/family", () => ({
  useFamilyProfile: () => ({ data: state.data, isLoading: false, isError: !state.data }),
}));

afterEach(cleanup);

const ada: Profile = {
  id: "ada",
  firstName: "Ada",
  lastName: "Obi",
  photoUrl: null,
  bio: "I sing in the choir.",
  gender: "Female",
  joinedAt: "2020-03-01T00:00:00.000Z",
  birthday: { day: 18, month: 2 },
  maritalStatus: "MARRIED",
  anniversary: { day: 20, month: 6 },
  spouse: { id: "bayo", name: "Bayo Obi", photoUrl: null },
  spouseName: null,
  socials: { instagram: "ada.obi", facebook: null, twitter: null, linkedin: null, tiktok: null },
  units: [{ id: "u1", name: "Choir", description: null, isLead: true, isAssistant: false }],
};

describe("another member's profile", () => {
  it("shows what they share with the church family, with a link to their spouse", () => {
    state.data = ada;
    render(<FamilyProfile id="ada" />);
    expect(screen.getByRole("heading", { name: "Ada Obi" })).toBeInTheDocument();
    expect(screen.getByText("I sing in the choir.")).toBeInTheDocument();
    expect(screen.getByText("18 February")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bayo Obi" })).toHaveAttribute("href", "/dashboard/family/bayo");
    expect(screen.getByText("Choir")).toBeInTheDocument();
    expect(screen.getByText("Leads")).toBeInTheDocument();
  });

  it("says so when the member cannot be found", () => {
    state.data = undefined;
    render(<FamilyProfile id="gone" />);
    expect(screen.getByRole("alert")).toHaveTextContent("could not be found");
  });
});
