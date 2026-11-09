import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePagedList } from "./usePagedList";

const list = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("usePagedList", () => {
  it("slices the loaded list into pages", () => {
    const { result } = renderHook(() => usePagedList(list(60), { pageSize: 25 }));
    expect(result.current.items).toEqual(list(25));
    expect(result.current.pageCount).toBe(3);
    act(() => result.current.setPage(3));
    expect(result.current.items).toEqual([51, 52, 53, 54, 55, 56, 57, 58, 59, 60]);
  });

  it("goes back to page 1 when the reset key changes", () => {
    const { result, rerender } = renderHook(({ key }) => usePagedList(list(60), { pageSize: 25, resetKey: key }), {
      initialProps: { key: "a" },
    });
    act(() => result.current.setPage(2));
    rerender({ key: "b" });
    expect(result.current.page).toBe(1);
  });

  it("pulls back to the last page when the list shrinks", () => {
    const { result, rerender } = renderHook(({ n }) => usePagedList(list(n), { pageSize: 25 }), { initialProps: { n: 60 } });
    act(() => result.current.setPage(3));
    rerender({ n: 30 });
    expect(result.current.page).toBe(2);
  });

  it("starts again at page 1 after changing the page size", () => {
    const { result } = renderHook(() => usePagedList(list(60), { pageSize: 10 }));
    act(() => result.current.setPage(4));
    act(() => result.current.setPageSize(50));
    expect(result.current.page).toBe(1);
    expect(result.current.items).toHaveLength(50);
  });
});
