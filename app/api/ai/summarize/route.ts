import { NextResponse } from "next/server";
import { z } from "zod";
import { modelRouter } from "@/lib/ai/model-router";
import { boundedTextSchema, readJson, requestPayloadErrorResponse, requireUser } from "@/lib/security/api";

const summarizeSchema = z.object({
  text: boundedTextSchema(20, 50000),
  language: z.enum(["en", "es"]).default("es"),
  advanced: z.boolean().default(false)
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

  const body = summarizeSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid summary request." }, { status: 400 });
  }

  const result = await modelRouter.generateText({
    taskType: body.data.advanced ? "advanced_summary" : "simple_summary",
    prompt: body.data.text,
    language: body.data.language
  });

  return NextResponse.json(result);
}
