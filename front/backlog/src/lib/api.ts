// src/lib/api.ts
import axios, { AxiosError } from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false, // ponelo en true si después usás cookies/sessions
});

// Convierte errores de Axios a mensajes útiles
function toErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ error?: string; message?: string }>;
    const status = ax.response?.status;
    const data = ax.response?.data;

    // Tu API suele responder { error: "..." }
    const apiMsg =
      typeof data === "string"
        ? data
        : typeof data?.error === "string"
          ? data.error
          : typeof data?.message === "string"
            ? data.message
            : undefined;

    return apiMsg || `${fallback}${status ? ` (${status})` : ""}`;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function apiGet<T>(path: string): Promise<T> {
  try {
    const res = await api.get<T>(path);
    return res.data;
  } catch (err) {
    throw new Error(toErrorMessage(err, `GET ${path} failed`));
  }
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  try {
    const res = await api.request<T>({
      url: path,
      method,
      data: body,
    });
    return res.data;
  } catch (err) {
    throw new Error(toErrorMessage(err, `${method} ${path} failed`));
  }
}
