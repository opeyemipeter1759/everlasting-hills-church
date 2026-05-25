// src/lib/api/axios.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { clearAuthTokens, getAccessToken } from "./authTokens";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — attach auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthTokens();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(normalizeError(error));
  }
);

// Shape errors into a predictable structure
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

function normalizeError(error: AxiosError): ApiError {
  if (error.response) {
    const data = error.response.data as { message?: string } | undefined;
    return {
      message: data?.message ?? error.message,
      status: error.response.status,
      data: error.response.data,
    };
  }
  if (error.request) {
    return { message: "No response from server. Check your connection." };
  }
  return { message: error.message };
}