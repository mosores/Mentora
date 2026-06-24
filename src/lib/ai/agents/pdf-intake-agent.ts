import { getPdfMaxBytes, getPdfMaxPages } from "@/lib/limits";
import { PDFParse } from "pdf-parse";
import path from "node:path";
import { pathToFileURL } from "node:url";

const pdfWorkerPath = path.join(
  process.cwd(),
  "node_modules",
  "pdf-parse",
  "dist",
  "worker",
  "pdf.worker.mjs"
);
PDFParse.setWorker(pathToFileURL(pdfWorkerPath).href);

export interface IntakeResult {
  ok: boolean;
  error?: string;
  pageCount?: number;
  metadata?: {
    byte_size: number;
    file_name: string;
    page_count?: number;
  };
}

/**
 * PDF Intake Agent
 * Validates file size, file extension, and page count limits of the uploaded PDF buffer.
 */
export async function validateAndIntake(
  buffer: Buffer,
  fileName: string
): Promise<IntakeResult> {
  const maxBytes = getPdfMaxBytes();
  if (buffer.byteLength <= 0 || buffer.byteLength > maxBytes) {
    const sizeMb = (maxBytes / (1024 * 1024)).toFixed(0);
    return {
      ok: false,
      error: `This PDF is too large to process. Maximum file size is ${sizeMb} MB.`,
    };
  }

  if (!fileName.toLowerCase().endsWith(".pdf")) {
    return {
      ok: false,
      error: "Unsupported file format. Only PDF files are allowed.",
    };
  }

  try {
    const parser = new PDFParse({ data: buffer });
    // Run text parsing to extract page count
    const parsed = await parser.getText({ pageJoiner: "" }).finally(() => parser.destroy());
    const pageCount = parsed.total || parsed.pages?.length || 0;
    const maxPages = getPdfMaxPages();

    if (pageCount > maxPages) {
      return {
        ok: false,
        error: `This PDF has ${pageCount} pages, which exceeds the limit of ${maxPages} pages. Please upload a smaller document.`,
      };
    }

    return {
      ok: true,
      pageCount,
      metadata: {
        byte_size: buffer.byteLength,
        file_name: fileName,
        page_count: pageCount,
      },
    };
  } catch (error) {
    console.error("[Intake Agent] Failed to parse PDF metadata:", error);
    return {
      ok: false,
      error: "Unable to parse the PDF file. It may be corrupt or encrypted.",
    };
  }
}
