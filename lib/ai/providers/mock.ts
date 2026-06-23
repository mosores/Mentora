import type { AIProvider, EmbeddingInput, GenerateTextInput, GenerateTextResult, ProviderHealth } from "@/lib/ai/types";

export class MockAIProvider implements AIProvider {
  name = "mock";

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const languageLead =
      input.language === "es"
        ? "Aqui tienes una respuesta clara y basada en tus fuentes."
        : "Here is a clear answer grounded in your sources.";

    return {
      text: `${languageLead} ${this.responseForTask(input.taskType)}`,
      provider: this.name,
      model: "mock.study-tutor",
      inputTokens: Math.ceil(input.prompt.length / 4),
      outputTokens: 96,
      estimatedCost: 0
    };
  }

  async generateStructured<T>(input: GenerateTextInput): Promise<T> {
    const payload = {
      taskType: input.taskType,
      language: input.language,
      items: [
        {
          front: "What is the central concept?",
          back: "A concise, source-grounded explanation adapted to the student's preferences."
        }
      ]
    };

    return payload as T;
  }

  async generateEmbedding(input: EmbeddingInput): Promise<number[]> {
    const seed = Array.from(input.text.slice(0, 32)).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return Array.from({ length: 32 }, (_, index) => Number(((seed + index * 17) % 1000 / 1000).toFixed(3)));
  }

  async healthCheck(): Promise<ProviderHealth> {
    return { ok: true, latencyMs: 12 };
  }

  private responseForTask(taskType: GenerateTextInput["taskType"]) {
    const responses: Record<GenerateTextInput["taskType"], string> = {
      simple_summary: "I reduced the material into the essential ideas and next study actions.",
      advanced_summary: "I grouped the document into concepts, evidence, and exam-ready connections.",
      flashcard_generation: "I generated active-recall cards with difficulty labels and source notes.",
      quiz_generation: "I created a mixed quiz with explanations and weak-topic feedback.",
      tutor_chat_basic: "Let us break the idea into steps, then practice with one example.",
      tutor_chat_deep: "I will compare concepts, cite the source context, and test your understanding.",
      apa_style_output: "I drafted an academic-style summary and reference starting point.",
      embedding_generation: "Embedding generated for semantic retrieval.",
      study_plan_generation: "I built a short study plan around time available, exam date, and weak topics."
    };

    return responses[taskType];
  }
}
