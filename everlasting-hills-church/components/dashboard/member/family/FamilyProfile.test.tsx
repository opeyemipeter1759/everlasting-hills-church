import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FamilyProfile as Profile, ProfileCommentsPage } from "@/lib/api/family";
import FamilyProfile from "./FamilyProfile";
import { pageWindow } from "./Pagination";

const state = vi.hoisted(() => ({
  data: undefined as Profile | undefined,
  comments: { items: [], total: 0, page: 1, pageSize: 20 } as ProfileCommentsPage,
}));
const like = vi.hoisted(() => vi.fn());
const addComment = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/family", () => ({
  useFamilyProfile: () => ({ data: state.data, isLoading: false, isError: !state.data }),
  useLikeProfile: () => ({ mutate: like, isPending: false }),
  useProfileComments: () => ({ data: state.comments, isLoading: false }),
  useAddProfileComment: () => ({ mutateAsync: addComment, isPending: false }),
  useDeleteProfileComment: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useProfileCover: () => ({ upload: { mutateAsync: vi.fn(), isPending: false }, remove: { mutate: vi.fn(), isPending: false } }),
}));
vi.mock("@/lib/api", () => ({ useMe: () => ({ data: { member: { id: "bayo" }, effectiveRoles: ["MEMBER"] } }) }));

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
  spouse: { id: "chidi", name: "Chidi Obi", photoUrl: null },
  spouseName: null,
  socials: { instagram: "ada.obi", facebook: null, twitter: null, linkedin: null, tiktok: null },
  units: [{ id: "u1", name: "Choir", description: null, isLead: true, isAssistant: false }],
  stats: {
    servicesAttended: 42,
    daysInTheWord: 120,
    plansFinished: 2,
    peopleReached: 15,
    soulsWon: 4,
    booksRead: 3,
    articlesPublished: 1,
    coursesCompleted: 0,
    badges: 2,
    likesReceived: 7,
    commentsReceived: 1,
  },
  badges: [
    { id: "attendance-25", track: "attendance", name: "Planted in the House", description: "25 services attended", level: "gold", earnedAt: "2026-05-03T09:00:00.000Z" },
    { id: "saved-1", track: "saved", name: "First Fruit", description: "1 soul won to Christ", level: "bronze", earnedAt: "2026-02-01T09:00:00.000Z" },
  ],
  progress: [],
  articles: [
    { id: "a1", slug: "walking-in-faith", title: "Walking in faith", excerpt: "Lessons from Hebrews 11", coverImageUrl: null, readingMinutes: 4, likeCount: 3, publishedAt: "2026-09-01T00:00:00.000Z" },
  ],
  likeCount: 7,
  commentCount: 1,
  likedByMe: false,
  isMe: false,
  headline: "Civil engineer · Choir member · Lover of the Psalms",
  coverUrl: null,
  favouriteVerse: "The Lord is my shepherd; I shall not want.",
  favouriteVerseRef: "Psalm 23:1",
  journey: { bornAgainYear: 2008, waterBaptismYear: 2009, holySpiritYear: null, membershipClassYear: null },
  career: { occupation: "Civil engineer", employer: "Ibadan Works", industry: "Construction", skills: ["AutoCAD"] },
  gifts: ["Music"],
  interests: ["Football"],
  languages: ["English", "Yoruba"],
  prayerFocus: "Wisdom for my new role",
  testimony: "God healed me in 2019.",
  openTo: ["PRAYER_PARTNER"],
  phone: null,
};

beforeEach(() => {
  like.mockReset();
  addComment.mockReset().mockResolvedValue({ id: "c1" });
  state.comments = { items: [], total: 0, page: 1, pageSize: 20 };
});
afterEach(cleanup);

describe("a member's profile", () => {
  it("reads like a LinkedIn page for a walk with God", () => {
    state.data = ada;
    render(<FamilyProfile id="ada" />);
    expect(screen.getByRole("heading", { name: "Ada Obi" })).toBeInTheDocument();
    expect(screen.getByText("Civil engineer · Choir member · Lover of the Psalms")).toBeInTheDocument();
    expect(screen.getByText("“The Lord is my shepherd; I shall not want.”")).toBeInTheDocument();
    expect(screen.getByText("Born again")).toBeInTheDocument();
    expect(screen.getByText("Ibadan Works")).toBeInTheDocument();
    expect(screen.getByText("Wisdom for my new role")).toBeInTheDocument();
    expect(screen.queryByText(/Open to/)).not.toBeInTheDocument();
    expect(screen.getByText("God healed me in 2019.")).toBeInTheDocument();
    const glance = screen.getByRole("region", { name: "At a glance" });
    expect(within(glance).getByText("42")).toBeInTheDocument();
    expect(within(glance).getByText("Services attended")).toBeInTheDocument();
    // Under the name as the latest badge, and among the badges.
    expect(screen.getAllByText("Planted in the House")).toHaveLength(2);
    expect(screen.getByText(/Gold · 3 May 2026/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Walking in faith/ })).toHaveAttribute("href", "/dashboard/articles/walking-in-faith");
    expect(screen.getByRole("link", { name: "Chidi Obi" })).toHaveAttribute("href", "/dashboard/family/chidi");
  });

  it("can be liked, shared, and written about by another member", async () => {
    state.data = ada;
    render(<FamilyProfile id="ada" />);
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(like).toHaveBeenCalledWith(true);
    expect(screen.getByRole("button", { name: "Share profile" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Write something nice about Ada" }), { target: { value: "God bless you!" } });
    fireEvent.click(screen.getByRole("button", { name: "Post" }));
    expect(addComment).toHaveBeenCalledWith("God bless you!");
  });

  it("offers ways to begin writing something nice", () => {
    state.data = ada;
    render(<FamilyProfile id="ada" />);
    expect(screen.getByRole("heading", { name: "Write something nice about Ada" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "I thank God for you because…" }));
    expect(screen.getByRole("textbox", { name: "Write something nice about Ada" })).toHaveValue("I thank God for you because ");
  });

  it("on my own profile, offers editing and sharing instead of liking", () => {
    state.data = { ...ada, isMe: true };
    render(<FamilyProfile id="ada" />);
    expect(screen.getByRole("link", { name: "Edit profile" })).toHaveAttribute("href", "/dashboard/settings");
    expect(screen.getByRole("button", { name: "Share my profile" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Like" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Write something nice about/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What the family says about you" })).toBeInTheDocument();
  });

  it("lets me change my banner, and no one else", () => {
    state.data = { ...ada, isMe: true };
    render(<FamilyProfile id="ada" />);
    expect(screen.getByRole("button", { name: /Add a banner/ })).toBeInTheDocument();
    cleanup();
    state.data = ada;
    render(<FamilyProfile id="ada" />);
    expect(screen.queryByRole("button", { name: /Add a banner/ })).not.toBeInTheDocument();
  });

  it("shows only who someone is when they keep their profile private", () => {
    state.data = { id: "ada", firstName: "Ada", lastName: "Obi", photoUrl: null, headline: "Teacher", coverUrl: null, restricted: true, isMe: false } as never;
    render(<FamilyProfile id="ada" />);
    expect(screen.getByRole("heading", { name: "Ada Obi" })).toBeInTheDocument();
    expect(screen.getByText("Ada keeps their profile private.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Like" })).not.toBeInTheDocument();
  });

  it("says so when the member cannot be found", () => {
    state.data = undefined;
    render(<FamilyProfile id="gone" />);
    expect(screen.getByRole("alert")).toHaveTextContent("could not be found");
  });
});

describe("page numbers", () => {
  it("shows every page when there are few", () => {
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("keeps the first, last and neighbours, with gaps between", () => {
    expect(pageWindow(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
    expect(pageWindow(1, 12)).toEqual([1, 2, 3, 4, "…", 12]);
    expect(pageWindow(12, 12)).toEqual([1, "…", 9, 10, 11, 12]);
  });
});
