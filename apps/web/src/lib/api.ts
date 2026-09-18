import { cookies } from "next/headers";
import { API_URL } from "./config";
import { ACCESS_TOKEN_COOKIE } from "./session";

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: { message?: string | string[]; error?: string } | undefined,
  ) {
    super(
      typeof body?.message === "string"
        ? body.message
        : Array.isArray(body?.message)
          ? body.message.join(", ")
          : `API error ${status}`,
    );
  }
}

/** Серверный запрос к API от имени текущего пользователя (читает access-токен из httpOnly cookie). */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => undefined);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
