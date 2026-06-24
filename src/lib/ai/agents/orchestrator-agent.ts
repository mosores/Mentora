import type { SupabaseClient } from "@supabase/supabase-js";
import { retrieveRelevantContext } from "./retrieval-agent";
import type { Citation } from "@/lib/types";

export type ChatIntent = "general" | "summary" | "diagram" | "rag_qa";

export interface OrchestrationResult {
  intent: ChatIntent;
  citations: Citation[];
  contentStream?: string;
  precomputedText?: string;
}

/**
 * Detects intent using fast regex heuristics
 */
export function classifyIntent(message: string): ChatIntent {
  const normalized = message.toLowerCase().trim();

  // Short greetings or small talk
  if (/^(hola|hi|hello|hey|buenos dias|buenas tardes|buenas noches|gracias|thank you|thanks|bye|adios)$/i.test(normalized)) {
    return "general";
  }

  // Summary intent detection
  if (
    /\b(resumen|resumir|sintetiza|sintetizar|resuma|summary|summarize|summarise|overview|key points|puntos clave|thesis|tesis)\b/i.test(
      normalized
    )
  ) {
    return "summary";
  }

  // Diagram intent detection
  if (
    /\b(diagrama|mapa|esquema|flujo|organizador|diagram|mind\s*map|flowchart|concept\s*map|chart|graph)\b/i.test(
      normalized
    )
  ) {
    return "diagram";
  }

  return "rag_qa";
}

/**
 * Orchestrator Agent
 * Routes the query depending on intent. Retrieves precomputed summary/diagram artifacts
 * from Supabase to avoid runtime LLM calls, or coordinates retrieval for document QA.
 */
export async function orchestrateChat({
  service,
  tenantId,
  studySpaceId,
  message,
  mode,
}: {
  service: SupabaseClient;
  tenantId: string;
  studySpaceId: string;
  message: string;
  mode: "fast" | "tutor" | "agent";
}): Promise<OrchestrationResult> {
  // If mode is fast, always skip RAG and treat as general
  if (mode === "fast") {
    return { intent: "general", citations: [] };
  }

  // Retrieve space documents to verify status
  const { data: documents } = await service
    .from("documents")
    .select("id, file_name, processing_status, metadata")
    .eq("study_space_id", studySpaceId);

  const readyDocuments = (documents ?? []).filter((d) => d.processing_status === "ready");

  // If there are no ready documents, default to general chat
  if (readyDocuments.length === 0) {
    return { intent: "general", citations: [] };
  }

  const intent = classifyIntent(message);

  // Intent 1: Precomputed Summary
  if (intent === "summary") {
    // Check if we have a summary artifact in generated_artifacts
    const { data: summaryArtifact } = await service
      .from("generated_artifacts")
      .select("content, citations")
      .eq("study_space_id", studySpaceId)
      .eq("kind", "apa_summary")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (summaryArtifact) {
      console.log("[Orchestrator Agent] Found precomputed summary artifact. Returning instantly.");
      return {
        intent: "summary",
        citations: (summaryArtifact.citations ?? []) as Citation[],
        precomputedText: summaryArtifact.content,
      };
    }
  }

  // Intent 2: Precomputed Diagram
  if (intent === "diagram") {
    interface DocumentMetadata {
      precomputed_diagram?: string;
    }
    // Look for the precomputed diagram in document metadata
    const docWithDiagram = readyDocuments.find((d) => {
      const meta = d.metadata as DocumentMetadata | null;
      return meta && typeof meta === "object" && meta.precomputed_diagram;
    });
    if (docWithDiagram) {
      console.log("[Orchestrator Agent] Found precomputed diagram in document metadata. Returning instantly.");
      const meta = docWithDiagram.metadata as DocumentMetadata;
      const mermaidCode = meta.precomputed_diagram ?? "";
      const formattedResponse = 
        `Aquí tienes el diagrama conceptual del documento **${docWithDiagram.file_name}**:\n\n` +
        `\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\nPuedes usar este mapa para visualizar las relaciones clave del tema.`;
      
      return {
        intent: "diagram",
        citations: [],
        precomputedText: formattedResponse,
      };
    }
  }

  // Intent 3: Grounded PDF QA
  if (intent === "rag_qa" || mode === "tutor") {
    const citations = await retrieveRelevantContext({
      service,
      tenantId,
      studySpaceId,
      query: message,
    });

    // If semantic search didn't yield any high quality citation, degrade to general chat
    if (citations.length === 0) {
      console.log("[Orchestrator Agent] No relevant document context found. Falling back to general chat.");
      return { intent: "general", citations: [] };
    }

    return { intent: "rag_qa", citations };
  }

  return { intent: "general", citations: [] };
}
