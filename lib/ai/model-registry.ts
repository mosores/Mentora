export const modelRegistry = [
  {
    id: "mock.study-tutor",
    provider: "mock",
    displayName: "Mentora Mock Tutor",
    capabilities: ["chat", "summary", "flashcards", "quiz", "apa", "embeddings"],
    privacyLevel: "local_dev",
    costTier: "free",
    maxContextTokens: 16000,
    enabled: true
  },
  {
    id: "openai.premium-tutor",
    provider: "openai",
    displayName: "Premium Tutor Model",
    capabilities: ["chat", "structured", "reasoning", "apa"],
    privacyLevel: "enterprise_eligible",
    costTier: "premium",
    maxContextTokens: 128000,
    enabled: Boolean(process.env.OPENAI_API_KEY)
  },
  {
    id: "groq.fast-study",
    provider: "groq",
    displayName: "Fast Study Model",
    capabilities: ["chat", "summary", "flashcards", "quiz"],
    privacyLevel: "standard",
    costTier: "low",
    maxContextTokens: 32000,
    enabled: Boolean(process.env.GROQ_API_KEY)
  },
  {
    id: "openrouter.flex-study",
    provider: "openrouter",
    displayName: "OpenRouter Flexible Study Model",
    capabilities: ["chat", "summary", "flashcards", "quiz", "routing"],
    privacyLevel: "standard",
    costTier: "low",
    maxContextTokens: 128000,
    enabled: Boolean(process.env.OPENROUTER_API_KEY)
  }
] as const;
