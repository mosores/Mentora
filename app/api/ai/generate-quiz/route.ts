import { NextResponse } from "next/server";
import { z } from "zod";
import { modelRouter } from "@/lib/ai/model-router";
import { boundedTextSchema, readJson, requestPayloadErrorResponse, requireUser } from "@/lib/security/api";

const quizSchema = z.object({
  sourceText: boundedTextSchema(20, 50000),
  language: z.enum(["en", "es"]).default("es"),
  questionCount: z.number().int().min(3).max(20).default(6)
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

  const body = quizSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid quiz request." }, { status: 400 });
  }

  const result = await modelRouter.generateText({
    taskType: "quiz_generation",
    prompt: `Generate ${body.data.questionCount} exam-prep questions from this source:\n${body.data.sourceText}`,
    language: body.data.language
  });

  return NextResponse.json(result);
}
