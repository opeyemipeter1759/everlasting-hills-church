import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/axios";
import type { Testimonial } from "./types";

export function useTestimonials() {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    setDeleting(true);
    try {
      await apiClient.delete(`/testimonials/${t.id}`);
      await loadAll();
    } catch (err) {
      alert((err as { message?: string }).message ?? "Delete failed");
    } finally {
      setDeleting(false);
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

  return { items, loadError, loadAll, remove, deleting, togglePublish };
}
