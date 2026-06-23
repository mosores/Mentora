import { NextResponse } from "next/server";
import { z } from "zod";
import { buildChunks, generateFlashcards, generateQuiz, summarizeText } from "@/lib/study/generate";
import { addDocumentForUser, getStudySpace, type MentoraDocument } from "@/lib/server/store";
import { extractFileText } from "@/lib/server/extract-file-text";
import { idSchema, normalizePlainText, sanitizeFileName, requireUser } from "@/lib/security/api";

export const runtime = "nodejs";

const uploadMetaSchema = z.object({
  studySpaceId: idSchema,
  language: z.enum(["en", "es"]).default("es"),
  manualText: z.string().max(50000).optional()
});

const allowedMimeTypes = new Set(["application/pdf", "text/plain", "text/markdown", "text/csv"]);

export async function POST(request: Request) {
  const user = await requireUser(request);

  if (user instanceof NextResponse) {
    return user;
  }

  const formData = await request.formData();
  const parsed = uploadMetaSchema.safeParse({
    studySpaceId: formData.get("studySpaceId"),
    language: formData.get("language") ?? "es",
    manualText: formData.get("manualText") || undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid upload metadata." }, { status: 400 });
  }

  const studySpace = await getStudySpace(parsed.data.studySpaceId, user);

  if (!studySpace) {
    return NextResponse.json({ error: "Study space not found." }, { status: 404 });
  }

  const uploadedFile = formData.get("file");
  let extractedText = normalizePlainText(parsed.data.manualText ?? "");
  let name = "Manual study note";
  let mimeType = "text/plain";

  try {
    if (uploadedFile instanceof File && uploadedFile.size > 0) {
      const maxMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? "15");
      const maxBytes = maxMb * 1024 * 1024;

      if (uploadedFile.size > maxBytes) {
        return NextResponse.json(
          { error: `File exceeds the ${maxMb} MB upload limit.` },
          { status: 413 }
        );
      }

      const normalizedType = (uploadedFile.type || "application/octet-stream").toLowerCase();
      const safeName = sanitizeFileName(uploadedFile.name);
      const allowedExtension = /\.(pdf|txt|md|csv)$/i.test(safeName);

      if (!allowedMimeTypes.has(normalizedType) && !allowedExtension) {
        return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
      }

      const extracted = await extractFileText(uploadedFile);
      extractedText = extracted.text;
      name = safeName;
      mimeType = normalizedType;
    }

    if (extractedText.length < 20) {
      return NextResponse.json({ error: "We could not read enough text from this material." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const chunks = buildChunks(extractedText).map((chunk) => ({
      id: crypto.randomUUID(),
      content: chunk.content,
      index: chunk.index,
      tokenEstimate: chunk.tokenEstimate
    }));

    const document: MentoraDocument = {
      id: crypto.randomUUID(),
      studySpaceId: parsed.data.studySpaceId,
      name,
      mimeType,
      status: "ready",
      text: extractedText,
      summary: summarizeText(extractedText, parsed.data.language),
      chunks,
      flashcards: generateFlashcards(extractedText, name),
      quiz: generateQuiz(extractedText),
      createdAt: now,
      updatedAt: now
    };

    const savedDocument = await addDocumentForUser(document, user);

    if (!savedDocument) {
      return NextResponse.json({ error: "Study space not found." }, { status: 404 });
    }

    return NextResponse.json({ document: savedDocument }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "The file could not be processed."
      },
      { status: 400 }
    );
  }
}
