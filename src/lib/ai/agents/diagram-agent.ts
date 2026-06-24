import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGroundedText } from "@/lib/ai/gateway";
import type { TextChunk } from "@/lib/rag/chunk";

export interface DiagramAgentOptions {
  service: SupabaseClient;
  documentId: string;
  fileName: string;
  chunks: TextChunk[];
  onProgress?: (step: string) => void;
}

/**
 * Diagram Agent
 * Pre-generates a Mermaid-compatible visual concept map/diagram representing the document structure
 * and stores it in the document's metadata.
 */
export async function generateAndStoreDiagram({
  service,
  documentId,
  fileName,
  chunks,
  onProgress,
}: DiagramAgentOptions): Promise<string> {
  onProgress?.("Analyzing content structure for visual mapping...");

  if (chunks.length === 0) {
    throw new Error("Cannot generate diagrams for a document with no text content.");
  }

  // Sample chunks (focusing on introduction and structural components)
  const sampleSize = Math.min(8, chunks.length);
  const step = Math.floor(chunks.length / sampleSize) || 1;
  const sampleChunks: TextChunk[] = [];
  for (let i = 0; i < sampleSize; i++) {
    sampleChunks.push(chunks[i * step]);
  }

  const textContext = sampleChunks.map((c) => c.content).join("\n\n");

  onProgress?.("Generating Mermaid concept map...");

  const systemPrompt = `You are a diagrams agent. Generate a clean, syntactically correct Mermaid.js diagram code block representing the concepts in the text.
Use the Mermaid 'graph TD' or 'mindmap' syntax. 
Do not write anything else. Return ONLY the raw code inside a markdown code block starting with \`\`\`mermaid and ending with \`\`\`.
Ensure node names with special characters are quoted, like: A["Concept A (Detail)"] --> B["Concept B"].
Do not use HTML in node labels.`;

  const userPrompt = `Document: ${fileName}

Source Excerpts:
${textContext}

Please generate the Mermaid diagram:`;

  const aiResult = await generateGroundedText({
    task: "tutor_chat",
    priority: "quality",
    system: systemPrompt,
    prompt: userPrompt,
  });

  // Extract the raw mermaid block
  let mermaidCode = aiResult.text.trim();
  const match = mermaidCode.match(/```mermaid([\s\S]*?)```/);
  if (match) {
    mermaidCode = match[1].trim();
  }

  onProgress?.("Saving diagram code to document metadata...");

  // Retrieve current document metadata
  const { data: documentData } = await service
    .from("documents")
    .select("metadata")
    .eq("id", documentId)
    .single();

  const currentMetadata = documentData?.metadata || {};
  const updatedMetadata = {
    ...currentMetadata,
    precomputed_diagram: mermaidCode,
  };

  const { error } = await service
    .from("documents")
    .update({ metadata: updatedMetadata })
    .eq("id", documentId);

  if (error) {
    throw error;
  }

  return mermaidCode;
}
