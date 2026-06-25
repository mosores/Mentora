import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { getWorkspaceSnapshot } from "@/lib/workspace";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json(await getWorkspaceSnapshot(session.user));
}
