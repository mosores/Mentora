import { NextResponse } from "next/server";

export const runtime = "nodejs";

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
  architecture?: {
    modality?: string;
  };
}

export type MentoraModelOption = {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  provider: "openrouter" | "mock";
  isFree: boolean;
  requiresLogin: boolean;
  priceLabel: string;
};

let cachedModels: { data: MentoraModelOption[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  if (cachedModels && Date.now() - cachedModels.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ models: cachedModels.data, cached: true });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:3000",
        "X-Title": "Mentora Study Platform",
        "Content-Type": "application/json"
      },
      next: { revalidate: 600 }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter models API responded ${response.status}`);
    }

    const payload = (await response.json()) as { data: OpenRouterModel[] };
    const models = payload.data
      .filter((model) => !model.architecture?.modality || model.architecture.modality.includes("text"))
      .map(toOption)
      .sort((a, b) => Number(b.isFree) - Number(a.isFree) || b.contextLength - a.contextLength)
      .slice(0, 50);

    cachedModels = { data: models, fetchedAt: Date.now() };
    return NextResponse.json({ models, source: "openrouter" });
  } catch (error) {
    console.error("[/api/ai/models] Failed to fetch OpenRouter models:", error);
    return NextResponse.json({ models: fallbackModels(), fallback: true });
  }
}

function toOption(model: OpenRouterModel): MentoraModelOption {
  const isFree = isFreeModel(model);
  const promptPrice = Number(model.pricing.prompt || 0);
  const completionPrice = Number(model.pricing.completion || 0);

  return {
    id: model.id,
    name: model.name || model.id,
    description: model.description || `${model.context_length?.toLocaleString() ?? "Unknown"} token context window.`,
    contextLength: model.context_length ?? 0,
    provider: "openrouter",
    isFree,
    requiresLogin: !isFree,
    priceLabel: isFree ? "Free" : `$${promptPrice.toFixed(4)} / $${completionPrice.toFixed(4)} per token unit`
  };
}

function isFreeModel(model: OpenRouterModel) {
  const freeById = model.id.endsWith(":free");
  const freeByPrice =
    (model.pricing.prompt === "0" || model.pricing.prompt === "0.000000") &&
    (model.pricing.completion === "0" || model.pricing.completion === "0.000000");

  return freeById || freeByPrice;
}

function fallbackModels(): MentoraModelOption[] {
  return [
    {
      id: "mock.study-tutor",
      name: "Mentora Local Tutor",
      description: "Offline-safe fallback for local development and demos.",
      contextLength: 16000,
      provider: "mock",
      isFree: true,
      requiresLogin: false,
      priceLabel: "Free"
    },
    {
      id: "deepseek/deepseek-r1:free",
      name: "DeepSeek R1 (Free)",
      description: "Reasoning model useful for step-by-step explanations.",
      contextLength: 163840,
      provider: "openrouter",
      isFree: true,
      requiresLogin: false,
      priceLabel: "Free"
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct:free",
      name: "Llama 3.3 70B Instruct (Free)",
      description: "Open model for academic tutoring and summaries.",
      contextLength: 131072,
      provider: "openrouter",
      isFree: true,
      requiresLogin: false,
      priceLabel: "Free"
    },
    {
      id: "openai/gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      description: "Paid model option for stronger tutoring quality through OpenRouter.",
      contextLength: 1047576,
      provider: "openrouter",
      isFree: false,
      requiresLogin: true,
      priceLabel: "Paid"
    },
    {
      id: "anthropic/claude-3.5-sonnet",
      name: "Claude 3.5 Sonnet",
      description: "Paid model option for deeper academic reasoning through OpenRouter.",
      contextLength: 200000,
      provider: "openrouter",
      isFree: false,
      requiresLogin: true,
      priceLabel: "Paid"
    }
  ];
}
