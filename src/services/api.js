import axios from "axios";
import { getStorageItem } from "../utils/storage";

export const AUTH_EXPIRED_EVENT = "notesphere:auth-expired";
let hasDispatchedAuthExpired = false;

const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:5000/api" : "/api");

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

api.interceptors.request.use((config) => {
  const token = getStorageItem("notesphere-token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getStorageItem("notesphere-token") && !hasDispatchedAuthExpired) {
      hasDispatchedAuthExpired = true;
      window.dispatchEvent(
        new CustomEvent(AUTH_EXPIRED_EVENT, {
          detail: {
            message: getErrorMessage(error, "Your session has expired. Please log in again.")
          }
        })
      );
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallbackMessage = "Something went wrong.") {
  if (error?.response?.status !== 401) {
    hasDispatchedAuthExpired = false;
  }

  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;

    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }

    if (error.code === "ECONNABORTED") {
      return "The request took too long. Please try again.";
    }

    if (!error.response) {
      return "Unable to reach the server. Check your connection and try again.";
    }

    if (error.response.status === 401) {
      return "Your session has expired. Please log in again.";
    }

    if (error.response.status >= 500) {
      return "The server ran into an unexpected error. Please try again.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

export default api;
