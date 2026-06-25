import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { createId, nowIso, updateDb } from "@/lib/data";
import { chunkSourceText, estimateTokens, extractKeywords, normalizeText, summarizeText } from "@/lib/study";
import { assertOwnedSpace, detailSpace } from "@/lib/workspace";

type RouteContext = {
  params: Promise<{ spaceId: string }>;
};

const maxUploadMb = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 15);
const maxUploadBytes = maxUploadMb * 1024 * 1024;

async function textFromFile(file: File) {
  if (file.size > maxUploadBytes) {
    throw new Error(`File is too large. Maximum upload size is ${maxUploadMb} MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name || "uploaded-material";
  const mimeType = file.type || "application/octet-stream";

  if (mimeType.includes("pdf") || name.toLowerCase().endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    return { name, mimeType, text: parsed.text };
  }

  if (
    mimeType.startsWith("text/") ||
    name.toLowerCase().endsWith(".txt") ||
    name.toLowerCase().endsWith(".md") ||
    name.toLowerCase().endsWith(".csv")
  ) {
    return { name, mimeType, text: buffer.toString("utf8") };
  }

  throw new Error("Unsupported file type. Upload a PDF or text-style file.");
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user } = await requireUser();
    const { spaceId } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");
    const pastedText = String(formData.get("text") ?? "");
    const title = String(formData.get("title") ?? "Pasted notes").trim().slice(0, 120);

    let source = {
      name: title || "Pasted notes",
      mimeType: "text/plain",
      text: pastedText
    };

    if (file instanceof File && file.size > 0) {
      source = await textFromFile(file);
    }

    const text = normalizeText(source.text);

    if (text.length < 80) {
      throw new Error("Add at least 80 readable characters so Mentora can create useful study material.");
    }

    const timestamp = nowIso();

    const result = await updateDb((db) => {
      const space = assertOwnedSpace(db, user.id, spaceId);
      const documentId = createId("doc");
      const chunks = chunkSourceText(text);
      const document = {
        id: documentId,
        userId: user.id,
        spaceId,
        name: source.name,
        mimeType: source.mimeType,
        text,
        summary: summarizeText(text),
        chunkCount: chunks.length,
        createdAt: timestamp
      };

      db.documents.push(document);
      db.chunks.push(
        ...chunks.map((chunk, index) => ({
          id: createId("chunk"),
          userId: user.id,
          spaceId,
          documentId,
          sourceName: source.name,
          chunkIndex: index + 1,
          text: chunk,
          keywords: extractKeywords(chunk),
          createdAt: timestamp
        }))
      );
      db.usageEvents.push({
        id: createId("usage"),
        userId: user.id,
        spaceId,
        type: "document_upload",
        provider: "local",
        model: "local-study-engine",
        tokenEstimate: estimateTokens(text),
        costEstimateUsd: 0,
        createdAt: timestamp
      });
      space.updatedAt = timestamp;

      return { document, space: detailSpace(db, user.id, spaceId) };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
