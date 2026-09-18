import { NextRequest, NextResponse } from "next/server";
import { API_URL } from "@/lib/config";
import { setSessionCookies } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await apiRes.json().catch(() => undefined);
  if (!apiRes.ok) {
    return NextResponse.json(data, { status: apiRes.status });
  }

  await setSessionCookies({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  });

  return NextResponse.json({ user: data.user, requiresParentConsent: data.requiresParentConsent });
}
