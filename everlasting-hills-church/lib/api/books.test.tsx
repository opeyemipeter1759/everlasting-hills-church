import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useBookCollectionsFeed, useBooksFeed } from "./books";

const get = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/request", () => ({ api: { get } }));

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("the member Books page", () => {
  it("loads books and shelves with one request to /books/feed", async () => {
    get.mockResolvedValue({ books: [{ id: "b1" }], collections: [{ id: "c1" }] });
    const { result } = renderHook(() => [useBooksFeed(), useBookCollectionsFeed()] as const, { wrapper: wrapper() });
    await waitFor(() => expect(result.current[0].data).toEqual([{ id: "b1" }]));
    expect(result.current[1].data).toEqual([{ id: "c1" }]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith("/books/feed");
  });
});
