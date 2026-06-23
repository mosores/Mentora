import { NextResponse } from "next/server";
import { z } from "zod";
import { createStudySpace, listStudySpaces } from "@/lib/server/store";
import { boundedTextSchema, readJson, requestPayloadErrorResponse, requireUser } from "@/lib/security/api";

export const runtime = "nodejs";

const studySpaceSchema = z.object({
  title: boundedTextSchema(2, 100),
  courseName: z.string().trim().max(100).default(""),
  institution: z.string().trim().max(120).default(""),
  language: z.enum(["en", "es"]).default("es")
});

export async function GET(request: Request) {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  const studySpaces = await listStudySpaces(user);
  return NextResponse.json({ studySpaces });
}

export async function POST(request: Request) {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  let payload: unknown;

  try {
    payload = await readJson(request, 16 * 1024);
  } catch (error) {
    return requestPayloadErrorResponse(error);
  }

  const body = studySpaceSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid study space." }, { status: 400 });
  }

  const studySpace = await createStudySpace(body.data, user);
  return NextResponse.json({ studySpace }, { status: 201 });
}
