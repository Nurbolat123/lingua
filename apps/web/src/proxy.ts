import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_URL } from "@/lib/config";
import {
  ACCESS_TOKEN_COOKIE,
  decodeAccessToken,
  REFRESH_TOKEN_COOKIE,
  Role,
  ROLE_HOME,
} from "@/lib/session";

const ZONE_ROLE: Record<string, Role> = {
  "/student": "STUDENT",
  "/parent": "PARENT",
  "/curator": "CURATOR",
  "/admin": "ADMIN",
};

// Доступно любой авторизованной роли (не привязано к одному кабинету)
const AUTH_ONLY_PREFIXES = ["/notifications"];

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

async function refreshSession(refreshToken: string) {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;
  return (await res.json()) as { accessToken: string; refreshToken: string; expiresIn: number };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const now = Math.floor(Date.now() / 1000);

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  let payload = accessToken ? decodeAccessToken(accessToken) : null;
  let refreshed: { accessToken: string; refreshToken: string; expiresIn: number } | null = null;

  if (!payload || payload.exp <= now) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
      refreshed = await refreshSession(refreshToken);
      if (refreshed) {
        accessToken = refreshed.accessToken;
        payload = decodeAccessToken(accessToken);
      } else {
        payload = null;
      }
    } else {
      payload = null;
    }
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const zonePrefix = Object.keys(ZONE_ROLE).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAuthOnly = AUTH_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  let response: NextResponse;

  if (isAuthPage) {
    response = payload
      ? NextResponse.redirect(new URL(ROLE_HOME[payload.role], request.url))
      : NextResponse.next();
  } else if (zonePrefix) {
    if (!payload) {
      response = NextResponse.redirect(new URL("/login", request.url));
    } else if (payload.role !== ZONE_ROLE[zonePrefix]) {
      response = NextResponse.redirect(new URL(ROLE_HOME[payload.role], request.url));
    } else {
      response = NextResponse.next();
    }
  } else if (isAuthOnly) {
    response = payload ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
  } else {
    response = NextResponse.next();
  }

  if (refreshed) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, {
      ...COOKIE_BASE,
      maxAge: refreshed.expiresIn,
    });
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, {
      ...COOKIE_BASE,
      maxAge: REFRESH_COOKIE_MAX_AGE,
    });
  } else if (!payload && (zonePrefix || isAuthOnly || request.cookies.get(REFRESH_TOKEN_COOKIE))) {
    // Просроченные/недействительные токены не оставляем в браузере.
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }

  return response;
}

export const config = {
  matcher: ["/student/:path*", "/parent/:path*", "/curator/:path*", "/admin/:path*", "/notifications/:path*", "/login", "/register"],
};
