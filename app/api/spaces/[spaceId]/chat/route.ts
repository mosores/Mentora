import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createId, nowIso, updateDb } from "@/lib/data";
import { estimateTokens, localTutorAnswer } from "@/lib/study";
import { assertOwnedSpace, detailSpace } from "@/lib/workspace";

type RouteContext = {
  params: Promise<{ spaceId: string }>;
};

const chatSchema = z.object({
  message: z.string().trim().min(2).max(2000)
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser();
    const { spaceId } = await context.params;
    const payload = chatSchema.parse(await readJson<unknown>(request));
    const timestamp = nowIso();

    const result = await updateDb((db) => {
      const space = assertOwnedSpace(db, user.id, spaceId);
      const chunks = db.chunks.filter((chunk) => chunk.spaceId === spaceId && chunk.userId === user.id);
      const answer = localTutorAnswer(payload.message, chunks);
      const userTurn = {
        id: createId("chat"),
        userId: user.id,
        spaceId,
        role: "user" as const,
        content: payload.message,
        citations: [],
        createdAt: timestamp
      };
      const assistantTurn = {
        id: createId("chat"),
        userId: user.id,
        spaceId,
        role: "assistant" as const,
        content: answer.answer,
        citations: answer.citations,
        createdAt: nowIso()
      };

      db.chatTurns.push(userTurn, assistantTurn);
      db.usageEvents.push({
        id: createId("usage"),
        userId: user.id,
        spaceId,
        type: "tutor_chat",
        provider: "local",
        model: "local-study-engine",
        tokenEstimate: estimateTokens(payload.message + answer.answer),
        costEstimateUsd: 0,
        createdAt: timestamp
      });
      space.updatedAt = timestamp;

      return { turns: [userTurn, assistantTurn], space: detailSpace(db, user.id, spaceId) };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
