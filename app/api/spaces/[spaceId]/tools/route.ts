import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createId, nowIso, updateDb } from "@/lib/data";
import { buildToolContent, estimateTokens, toolTitle } from "@/lib/study";
import type { ToolType } from "@/lib/types";
import { assertOwnedSpace, detailSpace } from "@/lib/workspace";

type RouteContext = {
  params: Promise<{ spaceId: string }>;
};

const toolSchema = z.object({
  type: z.enum(["summary", "flashcards", "quiz", "plan"])
});

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser();
    const { spaceId } = await context.params;
    const payload = toolSchema.parse(await readJson<unknown>(request));
    const timestamp = nowIso();

    const result = await updateDb((db) => {
      const space = assertOwnedSpace(db, user.id, spaceId);
      const chunks = db.chunks.filter((chunk) => chunk.spaceId === spaceId && chunk.userId === user.id);

      if (chunks.length === 0) {
        throw new Error("Upload study material before generating tools.");
      }

      const type = payload.type as ToolType;
      const content = buildToolContent(type, chunks);
      const tool = {
        id: createId("tool"),
        userId: user.id,
        spaceId,
        type,
        title: toolTitle(type),
        content,
        createdAt: timestamp
      };

      db.tools.unshift(tool);
      db.usageEvents.push({
        id: createId("usage"),
        userId: user.id,
        spaceId,
        type: `generate_${type}`,
        provider: "local",
        model: "local-study-engine",
        tokenEstimate: estimateTokens(JSON.stringify(content)),
        costEstimateUsd: 0,
        createdAt: timestamp
      });
      space.updatedAt = timestamp;

      return { tool, space: detailSpace(db, user.id, spaceId) };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
