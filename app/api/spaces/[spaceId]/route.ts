import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { readDb, updateDb } from "@/lib/data";
import { detailSpace } from "@/lib/workspace";

type RouteContext = {
  params: Promise<{ spaceId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser();
    const { spaceId } = await context.params;
    const db = await readDb();
    const space = detailSpace(db, user.id, spaceId);

    if (!space) {
      return NextResponse.json({ error: "Study space not found" }, { status: 404 });
    }

    return NextResponse.json({ space });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser();
    const { spaceId } = await context.params;

    await updateDb((db) => {
      const space = db.spaces.find((candidate) => candidate.id === spaceId && candidate.userId === user.id);

      if (!space) {
        throw new Error("Study space not found");
      }

      db.spaces = db.spaces.filter((candidate) => candidate.id !== spaceId);
      db.documents = db.documents.filter((document) => document.spaceId !== spaceId);
      db.chunks = db.chunks.filter((chunk) => chunk.spaceId !== spaceId);
      db.tools = db.tools.filter((tool) => tool.spaceId !== spaceId);
      db.chatTurns = db.chatTurns.filter((turn) => turn.spaceId !== spaceId);
      db.usageEvents = db.usageEvents.filter((event) => event.spaceId !== spaceId);
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
