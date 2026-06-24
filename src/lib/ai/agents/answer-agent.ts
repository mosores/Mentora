import { streamGroundedText, type AITextStreamResult } from "@/lib/ai/gateway";
import {
  buildGeneralTutorPrompt,
  buildGroundedPrompt,
  generalTutorSystemPrompt,
  tutorSystemPrompt,
} from "@/lib/ai/prompts";
import type { Citation, LearningProfile } from "@/lib/types";

export interface AnswerOptions {
  message: string;
  locale: "es" | "en";
  citations: Citation[];
  learningProfile?: LearningProfile;
  model?: string;
  openRouterApiKey?: string;
}

/**
 * Answer Agent
 * Constructs system prompts and prompts for grounded or general chats,
 * then initiates response streaming via the AI Gateway.
 */
export async function streamAnswer({
  message,
  locale,
  citations,
  learningProfile,
  model,
  openRouterApiKey,
}: AnswerOptions): Promise<AITextStreamResult> {
  const isGeneralChat = citations.length === 0;

  const system = isGeneralChat ? generalTutorSystemPrompt : tutorSystemPrompt;
  const prompt = isGeneralChat
    ? buildGeneralTutorPrompt(message, locale, learningProfile)
    : buildGroundedPrompt(message, citations, locale, learningProfile);

  return streamGroundedText({
    task: "tutor_chat",
    priority: "speed",
    system,
    prompt,
    model,
    openRouterApiKey,
  });
}
