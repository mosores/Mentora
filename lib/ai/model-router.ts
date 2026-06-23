import { modelRegistry } from "@/lib/ai/model-registry";
import { MockAIProvider } from "@/lib/ai/providers/mock";
import { OpenAICompatibleProvider } from "@/lib/ai/providers/openai-compatible";
import type { AIProvider, AITaskType, GenerateTextInput, GenerateTextResult } from "@/lib/ai/types";

type RoutingDecision = {
  provider: AIProvider;
  modelId: string;
  reason: string;
};

const providers: Record<string, AIProvider> = {
  mock: new MockAIProvider(),
  openai: new OpenAICompatibleProvider({
    name: "openai",
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small"
  }),
  groq: new OpenAICompatibleProvider({
    name: "groq",
    apiKey: process.env.GROQ_API_KEY,
    baseUrl: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
    chatModel: process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile"
  }),
  openrouter: new OpenAICompatibleProvider({
    name: "openrouter",
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    chatModel: process.env.OPENROUTER_CHAT_MODEL ?? "openai/gpt-4.1-mini",
    extraHeaders: {
      "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
      "X-Title": "Mentora Study Platform"
    }
  })
};

const freePlanTaskPreference: Record<AITaskType, string[]> = {
  simple_summary: ["mock.study-tutor", "groq.fast-study", "openrouter.flex-study"],
  advanced_summary: ["mock.study-tutor", "openai.premium-tutor"],
  flashcard_generation: ["mock.study-tutor", "groq.fast-study", "openrouter.flex-study"],
  quiz_generation: ["mock.study-tutor", "groq.fast-study", "openrouter.flex-study"],
  tutor_chat_basic: ["mock.study-tutor", "groq.fast-study", "openrouter.flex-study"],
  tutor_chat_deep: ["mock.study-tutor", "openai.premium-tutor"],
  apa_style_output: ["mock.study-tutor", "openai.premium-tutor"],
  embedding_generation: ["mock.study-tutor"],
  study_plan_generation: ["mock.study-tutor", "groq.fast-study"]
};

export class ModelRouter {
  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const decision = await this.selectProvider(input);

    try {
      return await decision.provider.generateText(input);
    } catch (error) {
      const fallback = providers.mock;
      const result = await fallback.generateText(input);

      return {
        ...result,
        text: result.text,
        provider: fallback.name,
        model: "mentora.local-study-engine"
      };
    }
  }

  async selectProvider(input: GenerateTextInput): Promise<RoutingDecision> {
    if (input.requestedModel) {
      return {
        provider: providers.openrouter,
        modelId: input.requestedModel,
        reason: `Selected user-requested OpenRouter model ${input.requestedModel}.`
      };
    }

    const preferredModelIds = freePlanTaskPreference[input.taskType];
    const configuredDefault = process.env.DEFAULT_AI_PROVIDER;
    const defaultCandidate = preferredModelIds
      .map((modelId) => modelRegistry.find((model) => model.id === modelId && model.enabled && model.provider === configuredDefault))
      .find(Boolean);
    const preferredCandidate = defaultCandidate ?? preferredModelIds
      .map((modelId) => modelRegistry.find((model) => model.id === modelId && model.enabled))
      .find((model) => model?.provider !== "mock");
    const candidate = preferredModelIds
      .map((modelId) => modelRegistry.find((model) => model.id === modelId && model.enabled))
      .find(Boolean);
    const selected = preferredCandidate ?? candidate;

    if (!selected) {
      return {
        provider: providers.mock,
        modelId: "mock.study-tutor",
        reason: "No enabled external model found; using local development provider."
      };
    }

    return {
      provider: providers[selected.provider] ?? providers.mock,
      modelId: selected.id,
      reason: `Selected ${selected.displayName} for ${input.taskType}.`
    };
  }
}

export const modelRouter = new ModelRouter();
