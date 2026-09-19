import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_URL } from "@/lib/config";
import { clearSessionCookies, REFRESH_TOKEN_COOKIE } from "@/lib/session";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
