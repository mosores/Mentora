import { NextResponse } from "next/server";
import { requireUser, idSchema } from "@/lib/security/api";
import { deleteDocumentForUser } from "@/lib/server/store";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  const { id, docId } = await params;
  const parsedSpaceId = idSchema.safeParse(id);
  const parsedDocId = idSchema.safeParse(docId);

  if (!parsedSpaceId.success || !parsedDocId.success) {
    return NextResponse.json({ error: "Invalid space or document id." }, { status: 400 });
  }

  const deleted = await deleteDocumentForUser(docId, user);

  if (!deleted) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ deleted: true, documentId: docId });
}
