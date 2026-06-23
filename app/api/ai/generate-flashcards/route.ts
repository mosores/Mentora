import { NextResponse } from "next/server";
import { z } from "zod";
import { modelRouter } from "@/lib/ai/model-router";
import { boundedTextSchema, readJson, requestPayloadErrorResponse, requireUser } from "@/lib/security/api";

const flashcardSchema = z.object({
  sourceText: boundedTextSchema(20, 50000),
  language: z.enum(["en", "es"]).default("es"),
  count: z.number().int().min(3).max(20).default(8)
});

export async function POST(request: Request) {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  let payload: unknown;

  try {
    payload = await readJson(request);
  } catch (error) {
    return requestPayloadErrorResponse(error);
  }

  const body = flashcardSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid flashcard request." }, { status: 400 });
  }

  const result = await modelRouter.generateText({
    taskType: "flashcard_generation",
    prompt: `Generate ${body.data.count} flashcards from this source:\n${body.data.sourceText}`,
    language: body.data.language
  });

  return NextResponse.json(result);
}
