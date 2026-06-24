import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGroundedText } from "@/lib/ai/gateway";
import type { TextChunk } from "@/lib/rag/chunk";
import type { Citation } from "@/lib/types";

export interface SummaryAgentOptions {
  service: SupabaseClient;
  tenantId: string;
  userId: string;
  studySpaceId: string;
  documentId: string;
  fileName: string;
  chunks: TextChunk[];
  onProgress?: (step: string) => void;
}

/**
 * Summary Agent
 * Creates a structured academic summary (Executive Summary, Detailed Analysis, Key Concepts, and Glossary)
 * from a representative sample of the document chunks. Stores the result in public.generated_artifacts.
 */
export async function generateAndStoreSummary({
  service,
  tenantId,
  userId,
  studySpaceId,
  documentId,
  fileName,
  chunks,
  onProgress,
}: SummaryAgentOptions): Promise<string> {
  onProgress?.("Selecting representative content for summarization...");

  if (chunks.length === 0) {
    throw new Error("Cannot summarize a document with no text content.");
  }

  // Sample chunks to represent the beginning, middle, and end of the document
  const sampleChunks: TextChunk[] = [];
  const total = chunks.length;

  if (total <= 10) {
    sampleChunks.push(...chunks);
  } else {
    // Take first 3
    sampleChunks.push(chunks[0], chunks[1], chunks[2]);
    
    // Take 4 middle chunks evenly spaced
    const step = Math.floor((total - 5) / 4);
    for (let i = 1; i <= 4; i++) {
      const idx = 3 + i * step;
      if (idx < total - 2) {
        sampleChunks.push(chunks[idx]);
      }
    }
    
    // Take last 2
    sampleChunks.push(chunks[total - 2], chunks[total - 1]);
  }

  onProgress?.("Generating structured APA-style summary using AI model...");

  const formattedExcerpts = sampleChunks
    .map((c, i) => `[Excerpt ${i + 1}] (Page ${c.pageNumber ?? "unknown"})\n${c.content}`)
    .join("\n\n");

  const systemPrompt = `You are an academic summarizer agent. Generate a clean, highly structured, APA-style study summary.
Do not use raw XML, JSON, or meta-logs. Structure your response into the following clear sections:
1. Executive Summary (a concise 1-paragraph overview)
2. Detailed Analysis (a detailed page-by-page or section-by-section breakdown)
3. Key Concepts (bullet points of the core academic models, theories, or ideas defined in the text)
4. Glossary (definitions of technical terms or specialized jargon found in the text)

Rely ONLY on the provided excerpts. Do not invent details.`;

  const userPrompt = `Document: ${fileName}

Source Excerpts:
${formattedExcerpts}

Please generate the structured summary:`;

  const aiResult = await generateGroundedText({
    task: "apa_summary",
    priority: "quality",
    system: systemPrompt,
    prompt: userPrompt,
  });

  const summaryContent = aiResult.text.trim();

  // Create fake citations corresponding to the sample chunks
  const citations: Citation[] = sampleChunks.map((chunk, index) => ({
    chunkId: `${documentId}_sample_${index}`,
    documentId: documentId,
    fileName: fileName,
    pageNumber: chunk.pageNumber,
    content: chunk.content.slice(0, 300),
  }));

  onProgress?.("Saving summary to generated artifacts...");

  // Write to generated_artifacts table
  const { data, error } = await service
    .from("generated_artifacts")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      study_space_id: studySpaceId,
      kind: "apa_summary",
      title: `Summary: ${fileName}`,
      content: summaryContent,
      citations: citations,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  // Update document metadata with a reference to the summary artifact
  const { data: documentData } = await service
    .from("documents")
    .select("metadata")
    .eq("id", documentId)
    .single();

  const currentMetadata = documentData?.metadata || {};
  await service
    .from("documents")
    .update({
      metadata: {
        ...currentMetadata,
        summary_artifact_id: data.id,
      },
    })
    .eq("id", documentId);

  return summaryContent;
}
