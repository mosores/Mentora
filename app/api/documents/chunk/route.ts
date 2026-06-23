import { NextResponse } from "next/server";
import { z } from "zod";
import { chunkText } from "@/lib/documents/chunk-text";
import { boundedTextSchema, readJson, requestPayloadErrorResponse, requireUser } from "@/lib/security/api";

const chunkSchema = z.object({
  text: boundedTextSchema(1, 50000),
  maxChars: z.number().int().min(800).max(6000).default(3200),
  overlapChars: z.number().int().min(100).max(1000).default(500)
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

  const body = chunkSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid chunk request." }, { status: 400 });
  }

  return NextResponse.json({
    chunks: chunkText(body.data.text, body.data.maxChars, body.data.overlapChars)
  });
}
