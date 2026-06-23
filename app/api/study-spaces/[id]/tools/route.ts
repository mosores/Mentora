import { NextResponse } from "next/server";
import { z } from "zod";
import { getStudySpace, updateDocumentForUser } from "@/lib/server/store";
import { generateFlashcards, generateQuiz, summarizeText } from "@/lib/study/generate";
import { idSchema, readJson, requestPayloadErrorResponse, requireUser } from "@/lib/security/api";

export const runtime = "nodejs";

const toolsSchema = z.object({
  tool: z.enum(["summary", "flashcards", "quiz"]).default("summary"),
  documentId: idSchema.optional(),
  language: z.enum(["en", "es"]).optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  const { id } = await params;
  const parsedId = idSchema.safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid study space id." }, { status: 400 });
  }

  let payload: unknown;

  try {
    payload = await readJson(request, 16 * 1024);
  } catch (error) {
    return requestPayloadErrorResponse(error);
  }

  const body = toolsSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Invalid tool request." }, { status: 400 });
  }

  const studySpace = await getStudySpace(id, user);

  if (!studySpace) {
    return NextResponse.json({ error: "Study space not found." }, { status: 404 });
  }

  const document = body.data.documentId ? studySpace.documents.find((item) => item.id === body.data.documentId) : studySpace.documents[0];

  if (!document) {
    return NextResponse.json({ error: "Upload a document first." }, { status: 400 });
  }

  if (body.data.tool === "flashcards") {
    document.flashcards = generateFlashcards(document.text, document.name);
  } else if (body.data.tool === "quiz") {
    document.quiz = generateQuiz(document.text);
  } else {
    document.summary = summarizeText(document.text, body.data.language ?? studySpace.language);
  }

  document.updatedAt = new Date().toISOString();
  const updatedDocument = await updateDocumentForUser(document, user);

  if (!updatedDocument) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ document: updatedDocument });
}
