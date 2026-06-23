export type AITaskType =
  | "simple_summary"
  | "advanced_summary"
  | "flashcard_generation"
  | "quiz_generation"
  | "tutor_chat_basic"
  | "tutor_chat_deep"
  | "apa_style_output"
  | "embedding_generation"
  | "study_plan_generation";

export type AIMode = "fast" | "deep" | "low_cost" | "source_strict";

export type GenerateTextInput = {
  taskType: AITaskType;
  prompt: string;
  language: "en" | "es";
  mode?: AIMode;
  context?: string[];
  requestedModel?: string;
  tenantId?: string;
  userId?: string;
};

export type GenerateTextResult = {
  text: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCost?: number;
};

export type EmbeddingInput = {
  text: string;
  tenantId?: string;
};

export type ProviderHealth = {
  ok: boolean;
  latencyMs?: number;
  reason?: string;
};

export interface AIProvider {
  name: string;
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
  generateStructured<T>(input: GenerateTextInput): Promise<T>;
  generateEmbedding(input: EmbeddingInput): Promise<number[]>;
  healthCheck(): Promise<ProviderHealth>;
}
