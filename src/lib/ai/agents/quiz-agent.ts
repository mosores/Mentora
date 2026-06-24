import type { SupabaseClient } from "@supabase/supabase-js";
import { generateGroundedText } from "@/lib/ai/gateway";
import { buildToolPrompt } from "@/lib/ai/prompts";
import type { TextChunk } from "@/lib/rag/chunk";
import type { Citation } from "@/lib/types";

export interface QuizAgentOptions {
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
 * Quiz & Flashcard Agent
 * Pre-generates quizzes and flashcards for the uploaded PDF and stores them in public.generated_artifacts.
 */
export async function generateQuizAndFlashcards({
  service,
  tenantId,
  userId,
  studySpaceId,
  documentId,
  fileName,
  chunks,
  onProgress,
}: QuizAgentOptions): Promise<{ quizId: string; flashcardsId: string }> {
  if (chunks.length === 0) {
    throw new Error("Cannot generate quizzes/flashcards for an empty document.");
  }

  // Sample chunks to use as ground truth context (approx 6-8 chunks)
  const sampleSize = Math.min(8, chunks.length);
  const step = Math.floor(chunks.length / sampleSize) || 1;
  const sampleChunks: TextChunk[] = [];
  for (let i = 0; i < sampleSize; i++) {
    sampleChunks.push(chunks[i * step]);
  }

  // Map to Citation format for buildToolPrompt
  const citations: Citation[] = sampleChunks.map((c, i) => ({
    chunkId: `${documentId}_quiz_${i}`,
    documentId: documentId,
    fileName: fileName,
    pageNumber: c.pageNumber,
    content: c.content,
  }));

  // 1. Generate Quiz
  onProgress?.("Generating exam-ready study quiz...");
  const quizPrompt = buildToolPrompt("quiz", citations, "es"); // default to Spanish
  const quizSystem = "You are an expert exam generator. Ensure every question is academically rigorous.";
  const quizResult = await generateGroundedText({
    task: "quiz",
    priority: "quality",
    system: quizSystem,
    prompt: quizPrompt,
  });

  const { data: quizData, error: quizError } = await service
    .from("generated_artifacts")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      study_space_id: studySpaceId,
      kind: "quiz",
      title: `Quiz: ${fileName}`,
      content: quizResult.text.trim(),
      citations: citations,
    })
    .select("id")
    .single();

  if (quizError || !quizData) {
    throw quizError ?? new Error("Failed to insert generated quiz.");
  }

  // 2. Generate Flashcards
  onProgress?.("Generating flashcards...");
  const fcPrompt = buildToolPrompt("flashcards", citations, "es");
  const fcSystem = "You are a flashcard generator. Strictly format your output as CARD 1, CARD 2, etc.";
  const fcResult = await generateGroundedText({
    task: "flashcards",
    priority: "quality",
    system: fcSystem,
    prompt: fcPrompt,
  });

  const { data: fcData, error: fcError } = await service
    .from("generated_artifacts")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      study_space_id: studySpaceId,
      kind: "flashcards",
      title: `Flashcards: ${fileName}`,
      content: fcResult.text.trim(),
      citations: citations,
    })
    .select("id")
    .single();

  if (fcError || !fcData) {
    throw fcError ?? new Error("Failed to insert generated flashcards.");
  }

  // 3. Update document metadata with artifact ids
  onProgress?.("Linking generated study tools to document...");
  const { data: docData } = await service
    .from("documents")
    .select("metadata")
    .eq("id", documentId)
    .single();

  const currentMetadata = docData?.metadata || {};
  await service
    .from("documents")
    .update({
      metadata: {
        ...currentMetadata,
        quiz_artifact_id: quizData.id,
        flashcards_artifact_id: fcData.id,
      },
    })
    .eq("id", documentId);

  return {
    quizId: quizData.id,
    flashcardsId: fcData.id,
  };
}
