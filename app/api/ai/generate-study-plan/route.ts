import { NextResponse } from "next/server";
import { z } from "zod";
import { idSchema, readJson, requestPayloadErrorResponse, requireUser } from "@/lib/security/api";
import { getStudySpace } from "@/lib/server/store";
import { generateStudyPlan } from "@/lib/study/generate";

export const runtime = "nodejs";

const studyPlanSchema = z.object({
  studySpaceId: idSchema,
  language: z.enum(["en", "es"]).default("es"),
  days: z.number().int().min(3).max(21).default(7)
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

  const body = studyPlanSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid study plan request." }, { status: 400 });
  }

  const studySpace = await getStudySpace(body.data.studySpaceId, user);

  if (!studySpace) {
    return NextResponse.json({ error: "Study space not found." }, { status: 404 });
  }

  const plan = generateStudyPlan({
    documents: studySpace.documents.map((document) => ({
      name: document.name,
      text: document.text,
      summary: document.summary,
      quiz: document.quiz
    })),
    language: body.data.language,
    days: body.data.days
  });

  return NextResponse.json({ plan, documentCount: studySpace.documents.length });
}
