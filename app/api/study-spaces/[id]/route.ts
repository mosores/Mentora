import { NextResponse } from "next/server";
import { idSchema, requireUser } from "@/lib/security/api";
import { getStudySpace } from "@/lib/server/store";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid study space id." }, { status: 400 });
  }

  const studySpace = await getStudySpace(id, user);

  if (!studySpace) {
    return NextResponse.json({ error: "Study space not found." }, { status: 404 });
  }

  return NextResponse.json({ studySpace });
}
