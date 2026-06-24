import { PDFParse } from "pdf-parse";
import type { SupabaseClient } from "@supabase/supabase-js";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { embedTexts, transcribePdfPageImage } from "@/lib/ai/gateway";
import { chunkPdfPages, chunkTextByPage, type TextChunk } from "@/lib/rag/chunk";
import { getAuthedProfile } from "@/lib/supabase/service";
import {
  ApiError,
  enforceContentLength,
  errorResponse,
  isPdfBuffer,
  jsonError,
  jsonResponse,
  rateLimit,
  rateLimitKey,
  requireOwnedStudySpace,
  safeErrorMessage,
} from "@/app/api/_shared/security";

export const runtime = "nodejs";
const MAX_PDF_BYTES = 50 * 1024 * 1024;
const MAX_FORM_BYTES = MAX_PDF_BYTES + 1024 * 1024;
const MAX_EXTRACTED_CHARS = 1_500_000;
const MAX_CHUNKS = 1500;
const EMBEDDING_BATCH_SIZE = 24;
const MAX_OCR_PAGES = 20;
const OCR_CONCURRENCY = 3;
const OCR_PAGE_TIMEOUT_MS = 30_000;
const MIN_MEANINGFUL_CHARS = 80;
const MIN_MEANINGFUL_WORDS = 12;
const studySpaceIdSchema = z.string().uuid();
const DOCUMENTS_BUCKET = "documents";

const pdfWorkerPath = path.join(process.cwd(), "node_modules", "pdf-parse", "dist", "worker", "pdf.worker.mjs");
PDFParse.setWorker(pathToFileURL(pdfWorkerPath).href);

export async function POST(request: Request) {
  let documentId: string | null = null;
  let service: SupabaseClient | null = null;
  let uploadedStoragePath: string | null = null;

  try {
    const authContext = await getAuthedProfile(request.headers.get("authorization"));
    const { profile } = authContext;
    service = authContext.service;
    const limit = rateLimit(rateLimitKey(request, profile.id, "ingest"), 6);
    if (!limit.ok) {
      return jsonError("Too many uploads. Please wait a minute and try again.", 429);
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      throw new ApiError(415, "Content-Type must be multipart/form-data.");
    }
    enforceContentLength(request, MAX_FORM_BYTES, true);

    const formData = await request.formData();
    const file = formData.get("file");
    const studySpaceId = formData.get("studySpaceId");

    if (!(file instanceof File) || typeof studySpaceId !== "string") {
      throw new ApiError(400, "PDF file and studySpaceId are required.");
    }

    const parsedStudySpaceId = studySpaceIdSchema.safeParse(studySpaceId);
    if (!parsedStudySpaceId.success) {
      throw new ApiError(400, "studySpaceId must be a valid UUID.");
    }

    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      throw new ApiError(400, "Only PDF uploads are supported.");
    }

    if (file.size <= 0 || file.size > MAX_PDF_BYTES) {
      throw new ApiError(400, "PDF must be between 1 byte and 50 MB.");
    }

    await requireOwnedStudySpace(service, profile, parsedStudySpaceId.data);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!isPdfBuffer(buffer)) {
      throw new ApiError(400, "Uploaded file is not a valid PDF.");
    }

    const safeName = file.name.replace(/[^\w.\-]+/g, "_").replace(/^_+/, "").slice(0, 120) || "document.pdf";
    const storagePath = `${profile.tenant_id}/${profile.id}/${parsedStudySpaceId.data}/${crypto.randomUUID()}-${safeName}`;

    await ensureDocumentsBucket(service);

    const { error: uploadError } = await service.storage.from(DOCUMENTS_BUCKET).upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

    if (uploadError) {
      throw uploadError;
    }
    uploadedStoragePath = storagePath;

    const { data: document, error: insertError } = await service
      .from("documents")
      .insert({
        study_space_id: parsedStudySpaceId.data,
        tenant_id: profile.tenant_id,
        user_id: profile.id,
        file_name: file.name,
        storage_path: storagePath,
        processing_status: "processing",
        metadata: { byte_size: file.size },
      })
      .select("id")
      .single();

    if (insertError || !document) {
      throw insertError ?? new Error("Unable to create document record.");
    }

    documentId = document.id;

    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText({ pageJoiner: "" }).finally(() => parser.destroy());
    const extractedText = parsed.text.trim();
    if (extractedText.length > MAX_EXTRACTED_CHARS) {
      throw new ApiError(413, "PDF text content is too large to process.");
    }

    const readablePages = parsed.pages.filter((page) => page.text.trim().length > 0);
    let extractionMethod: "text" | "ocr" = "text";
    let chunks = filterUsefulChunks(readablePages.length > 0 ? chunkPdfPages(readablePages) : chunkTextByPage(extractedText));

    if (!hasUsefulContent(chunks)) {
      extractionMethod = "ocr";
      const ocrPages = await extractTextWithOcr(buffer, parsed.total || parsed.pages.length);
      chunks = filterUsefulChunks(chunkPdfPages(ocrPages));
    }

    if (chunks.length === 0) {
      throw new ApiError(
        422,
        "No readable study content was found in this PDF. It may be scanned, image-based, protected, or mostly visual. Try exporting it as a text/OCR PDF and upload it again.",
      );
    }

    if (chunks.length > MAX_CHUNKS) {
      throw new ApiError(413, "PDF creates too many text chunks to process safely.");
    }

    for (let index = 0; index < chunks.length; index += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(index, index + EMBEDDING_BATCH_SIZE);
      const embeddings = await embedTexts(batch.map((chunk) => chunk.content));
      const rows = batch.map((chunk, batchIndex) => ({
        document_id: document.id,
        study_space_id: parsedStudySpaceId.data,
        tenant_id: profile.tenant_id,
        content: chunk.content,
        embedding: embeddings[batchIndex],
        page_number: chunk.pageNumber,
      }));

      const { error: chunkError } = await service.from("document_chunks").insert(rows);
      if (chunkError) {
        throw chunkError;
      }
    }

    const { error: updateError } = await service
      .from("documents")
      .update({
        processing_status: "ready",
        metadata: {
          byte_size: file.size,
          chunk_count: chunks.length,
          character_count: chunks.reduce((total, chunk) => total + chunk.content.length, 0),
          extraction_method: extractionMethod,
          original_text_character_count: extractedText.length,
        },
      })
      .eq("id", document.id);

    if (updateError) {
      throw updateError;
    }

    return jsonResponse({ documentId: document.id, chunks: chunks.length });
  } catch (error) {
    if (documentId && service) {
      try {
        await service.from("document_chunks").delete().eq("document_id", documentId);
        await service
          .from("documents")
          .update({
            processing_status: "failed",
            error_message: safeErrorMessage(error, "Unknown ingestion error."),
          })
          .eq("id", documentId);
      } catch {
        // Keep the original failure visible to the caller.
      }
    } else if (uploadedStoragePath && service) {
      try {
        await service.storage.from(DOCUMENTS_BUCKET).remove([uploadedStoragePath]);
      } catch {
        // Keep the original failure visible to the caller.
      }
    }

    return errorResponse(error, "Unable to process document.");
  }
}

function filterUsefulChunks(chunks: TextChunk[]) {
  return chunks
    .map((chunk) => ({ ...chunk, content: normalizeExtractedContent(chunk.content) }))
    .filter((chunk) => chunk.content.length > 0 && !isPageMarkerOnly(chunk.content));
}

function hasUsefulContent(chunks: TextChunk[]) {
  const combined = chunks.map((chunk) => chunk.content).join("\n");
  return countMeaningfulChars(combined) >= MIN_MEANINGFUL_CHARS && countMeaningfulWords(combined) >= MIN_MEANINGFUL_WORDS;
}

function normalizeExtractedContent(content: string) {
  return content
    .replace(/\r/g, "")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isPageMarkerOnly(content: string) {
  return normalizeExtractedContent(content).length === 0 || /^[-\s\dofpage]+$/i.test(content.trim());
}

function countMeaningfulChars(content: string) {
  return (content.match(/[\p{L}\p{N}]/gu) ?? []).length;
}

function countMeaningfulWords(content: string) {
  return (content.match(/[\p{L}\p{N}]{3,}/gu) ?? []).length;
}

async function extractTextWithOcr(buffer: Buffer, totalPages: number) {
  const pageCount = Math.min(Math.max(totalPages || 1, 1), MAX_OCR_PAGES);
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);
  const parser = new PDFParse({ data: Buffer.from(buffer) });
  let screenshots: Awaited<ReturnType<PDFParse["getScreenshot"]>>["pages"] = [];

  try {
    const screenshot = await parser.getScreenshot({
      desiredWidth: 1400,
      imageBuffer: true,
      imageDataUrl: false,
      partial: pageNumbers,
    });
    screenshots = screenshot.pages;
  } finally {
    await parser.destroy();
  }

  const pages = await mapWithConcurrency(screenshots, OCR_CONCURRENCY, async (screenshot) => {
    if (!screenshot.data || screenshot.data.byteLength === 0) {
      return null;
    }

    try {
      const text = normalizeExtractedContent(
        await withTimeout(
          transcribePdfPageImage({ image: screenshot.data, pageNumber: screenshot.pageNumber }),
          OCR_PAGE_TIMEOUT_MS,
        ),
      );

      if (countMeaningfulWords(text) === 0) {
        return null;
      }

      return { num: screenshot.pageNumber, text };
    } catch (error) {
      console.warn(`[Mentora] OCR failed for PDF page ${screenshot.pageNumber}.`, error);
      return null;
    }
  });

  return pages
    .filter((page): page is { num: number; text: string } => page !== null)
    .sort((first, second) => first.num - second.num);
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runWorker));
  return results;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms.`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function ensureDocumentsBucket(service: SupabaseClient) {
  const { error } = await service.storage.getBucket(DOCUMENTS_BUCKET);
  if (!error) {
    return;
  }

  const message = safeErrorMessage(error, "").toLowerCase();
  const statusCode = Number((error as { statusCode?: unknown; status?: unknown }).statusCode ?? (error as { status?: unknown }).status);
  if (statusCode !== 404 && !message.includes("not found") && !message.includes("does not exist")) {
    throw error;
  }

  const { error: createError } = await service.storage.createBucket(DOCUMENTS_BUCKET, {
    allowedMimeTypes: ["application/pdf"],
    fileSizeLimit: MAX_PDF_BYTES,
    public: false,
  });

  if (createError && !safeErrorMessage(createError, "").toLowerCase().includes("already exists")) {
    throw createError;
  }
}
