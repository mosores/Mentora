import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionToken } from "@/lib/security/api";
import { logoutSession } from "@/lib/server/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = getSessionToken(request);

  if (token) {
    await logoutSession(token);
  }

  return clearSessionCookie(NextResponse.json({ ok: true }));
}
