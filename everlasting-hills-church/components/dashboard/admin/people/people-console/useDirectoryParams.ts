import { useEffect, useState } from "react";
import type { DirectoryParams } from "@/lib/api/people";
import { DEFAULT_PARAMS } from "./constants";

export function useDirectoryParams() {
  const [params, setParams] = useState<DirectoryParams>(DEFAULT_PARAMS);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setParams((p) => ({ ...p, search: searchInput, page: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  function patch(next: Partial<DirectoryParams>, resetPage = true) {
    setParams((p) => ({ ...p, ...next, ...(resetPage ? { page: 1 } : {}) }));
  }

  function onSort(col: string) {
    setParams((p) => ({
      ...p,
      sortBy: col,
      sortOrder: p.sortBy === col && p.sortOrder === "asc" ? "desc" : "asc",
    }));
  }

  return { params, setParams, searchInput, setSearchInput, patch, onSort };
}
