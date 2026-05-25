// src/lib/api/request.ts
import { apiClient } from "./axios";

export const api = {
  get: <T>(url: string, params?: object) =>
    apiClient.get<T>(url, { params }).then((res) => res.data),

  post: <T>(url: string, body?: unknown) =>
    apiClient.post<T>(url, body).then((res) => res.data),

  put: <T>(url: string, body?: unknown) =>
    apiClient.put<T>(url, body).then((res) => res.data),

  patch: <T>(url: string, body?: unknown) =>
    apiClient.patch<T>(url, body).then((res) => res.data),

  delete: <T>(url: string) =>
    apiClient.delete<T>(url).then((res) => res.data),
};