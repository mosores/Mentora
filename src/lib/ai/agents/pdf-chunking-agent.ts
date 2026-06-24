import { chunkPdfPages, type TextChunk } from "@/lib/rag/chunk";
import { SAFETY_LIMITS } from "@/lib/limits";
import type { PageText } from "./pdf-reader-agent";

/**
 * PDF Chunking Agent
 * Receives extracted pages from the PDF Reader Agent, splits them into semantic chunks,
 * filters duplicates/useless content, and validates the result against max chunk limits.
 */
export function chunkPages(pages: PageText[]): TextChunk[] {
  // Map reader agent PageText to RAG chunking format
  const inputPages = pages.map((p) => ({
    num: p.num,
    text: p.text,
  }));

  const rawChunks = chunkPdfPages(inputPages);

  const seen = new Set<string>();
  const processedChunks: TextChunk[] = [];

  for (const chunk of rawChunks) {
    const cleaned = chunk.content.trim();
    if (!cleaned) {
      continue;
    }

    // Skip duplicates
    if (seen.has(cleaned)) {
      continue;
    }
    seen.add(cleaned);

    // Skip page-number-only or header/footer garbage
    const isMarker = /^[-\s\dofpage]+$/i.test(cleaned);
    if (isMarker) {
      continue;
    }

    processedChunks.push({
      content: cleaned,
      pageNumber: chunk.pageNumber,
    });
  }

  // Safety check on chunk count limits
  if (processedChunks.length > SAFETY_LIMITS.MAX_CHUNKS_PER_DOC) {
    throw new Error(
      `This PDF has too many sections (${processedChunks.length}). The limit is ${SAFETY_LIMITS.MAX_CHUNKS_PER_DOC} sections. Please try a shorter document.`
    );
  }

  return processedChunks;
}
