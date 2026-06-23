import pdfParse from "pdf-parse";
import { normalizePlainText } from "@/lib/security/api";

export async function extractFileText(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const lowerName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new Error("Invalid PDF file.");
    }

    const parsed = await pdfParse(buffer);
    return {
      text: normalizePlainText(parsed.text),
      pageCount: parsed.numpages
    };
  }

  if (mimeType.startsWith("text/") || lowerName.endsWith(".txt")) {
    const sample = buffer.subarray(0, Math.min(buffer.length, 2048));
    const nullBytes = sample.filter((byte) => byte === 0).length;

    if (sample.length > 0 && nullBytes / sample.length > 0.01) {
      throw new Error("Invalid text file.");
    }

    return {
      text: normalizePlainText(buffer.toString("utf8")),
      pageCount: undefined
    };
  }

  throw new Error("Unsupported file type");
}
