import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

// Совпадает со значением по умолчанию REFRESH_TOKEN_TTL_DAYS в apps/api.
// Реальный срок жизни токена проверяется на сервере API, это лишь срок хранения cookie.
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export type Role = "STUDENT" | "PARENT" | "CURATOR" | "ADMIN";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    const data = JSON.parse(json) as AccessTokenPayload;
    if (!data.sub || !data.role || !data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

/** Только для Route Handlers и Server Actions — там cookies() можно писать. */
export async function setSessionCookies(tokens: TokenPair) {
  const store = await cookies();
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  store.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, { ...base, maxAge: tokens.expiresIn });
  store.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, { ...base, maxAge: REFRESH_COOKIE_MAX_AGE });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

export const ROLE_HOME: Record<Role, string> = {
  STUDENT: "/student",
  PARENT: "/parent",
  CURATOR: "/curator",
  ADMIN: "/admin",
};
