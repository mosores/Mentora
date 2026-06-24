import type { SupabaseClient } from "@supabase/supabase-js";
import type { TextChunk } from "@/lib/rag/chunk";

export interface VerificationResult {
  isVerified: boolean;
  qualityScore: number; // 0 to 100
  warnings: string[];
}

/**
 * Source Verification Agent
 * Assesses the quality, integrity, and readability of the chunked text.
 * Stores a computed quality score and list of warnings in the document's metadata.
 */
export async function verifySource(
  service: SupabaseClient,
  documentId: string,
  chunks: TextChunk[]
): Promise<VerificationResult> {
  const warnings: string[] = [];
  let score = 100;

  if (chunks.length === 0) {
    return {
      isVerified: false,
      qualityScore: 0,
      warnings: ["No text chunks were generated for this document."],
    };
  }

  // 1. Check for duplicates
  const contents = new Set<string>();
  let duplicates = 0;
  for (const chunk of chunks) {
    if (contents.has(chunk.content)) {
      duplicates++;
    }
    contents.add(chunk.content);
  }
  if (duplicates > 0) {
    const percent = (duplicates / chunks.length) * 100;
    score -= Math.min(20, Math.round(percent));
    warnings.push(`Detected ${duplicates} duplicate text chunks (${percent.toFixed(1)}%).`);
  }

  // 2. Check for short chunks & encoding corruption
  let shortChunks = 0;
  let encodingIssues = 0;

  for (const chunk of chunks) {
    if (chunk.content.length < 150) {
      shortChunks++;
    }
    // Catch common encoding artifacts, e.g. lots of Unicode replacement characters
    const replacementCount = (chunk.content.match(/\uFFFD/g) || []).length;
    if (replacementCount > 3) {
      encodingIssues++;
    }
  }

  if (shortChunks > 0) {
    const percent = (shortChunks / chunks.length) * 100;
    score -= Math.min(15, Math.round(percent * 0.5));
    warnings.push(`Found ${shortChunks} very short chunks under 150 characters (${percent.toFixed(1)}%).`);
  }

  if (encodingIssues > 0) {
    const percent = (encodingIssues / chunks.length) * 100;
    score -= Math.min(30, Math.round(percent * 2));
    warnings.push(`Detected unicode encoding issues in ${encodingIssues} chunks (${percent.toFixed(1)}%).`);
  }

  // 3. Page coverage check
  const pageNumbers = chunks.map((c) => c.pageNumber).filter((num): num is number => num !== null);
  if (pageNumbers.length === 0) {
    warnings.push("No page number metadata could be mapped to chunks.");
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  // Update document metadata with verification results
  const { data: documentData } = await service
    .from("documents")
    .select("metadata")
    .eq("id", documentId)
    .single();

  const currentMetadata = documentData?.metadata || {};
  const updatedMetadata = {
    ...currentMetadata,
    quality_score: score,
    verification_warnings: warnings,
    is_verified: score >= 50,
  };

  await service
    .from("documents")
    .update({ metadata: updatedMetadata })
    .eq("id", documentId);

  return {
    isVerified: score >= 50,
    qualityScore: score,
    warnings,
  };
}
