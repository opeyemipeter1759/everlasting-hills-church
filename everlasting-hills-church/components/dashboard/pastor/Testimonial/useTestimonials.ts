import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/axios";
import type { Testimonial } from "./types";

export function useTestimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadAll() {
    setLoadError(null);
    try {
      const res = await apiClient.get<Testimonial[]>("/testimonials");
      setItems(res.data);
    } catch (err) {
      setLoadError((err as { message?: string }).message ?? "Failed to load");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function remove(t: Testimonial) {
    if (!confirm(`Delete testimonial from ${t.authorName}? This cannot be undone.`)) return;
    try {
      await apiClient.delete(`/testimonials/${t.id}`);
      await loadAll();
    } catch (err) {
      alert((err as { message?: string }).message ?? "Delete failed");
    }
  }

  async function togglePublish(t: Testimonial) {
    try {
      await apiClient.patch(`/testimonials/${t.id}`, { published: !t.published });
      await loadAll();
    } catch (err) {
      alert((err as { message?: string }).message ?? "Toggle failed");
    }
  }

  return { items, loadError, loadAll, remove, togglePublish };
}
