import { NextResponse } from "next/server";
import { requireUser } from "@/lib/security/api";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  return NextResponse.json({ user });
}
