import { chunkText } from "@/lib/documents/chunk-text";

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "you",
  "are",
  "was",
  "were",
  "but",
  "not",
  "una",
  "uno",
  "las",
  "los",
  "del",
  "que",
  "por",
  "con",
  "para",
  "como",
  "esta",
  "este",
  "sus",
  "una",
  "unos",
  "unas"
]);

export type GeneratedFlashcard = {
  id: string;
  front: string;
  back: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  sourceDocument?: string;
};

export type GeneratedQuizQuestion = {
  id: string;
  type: "multiple_choice";
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  topic: string;
};

export function summarizeText(text: string, language: "en" | "es" = "es") {
  const sentences = splitSentences(text);
  const keywords = extractKeywords(text, 8);
  const selected = sentences.slice(0, 4);

  if (selected.length === 0) {
    return language === "es"
      ? "Aun no hay texto suficiente para generar un resumen."
      : "There is not enough text yet to generate a summary.";
  }

  const lead =
    language === "es"
      ? "Resumen generado a partir del material subido:"
      : "Summary generated from the uploaded material:";

  return `${lead}\n\n${selected.map((sentence) => `- ${sentence}`).join("\n")}\n\n${
    language === "es" ? "Conceptos clave" : "Key concepts"
  }: ${keywords.join(", ") || (language === "es" ? "por revisar" : "to review")}.`;
}

export function generateFlashcards(text: string, sourceDocument?: string): GeneratedFlashcard[] {
  const keywords = extractKeywords(text, 8);
  const sentences = splitSentences(text);

  return keywords.slice(0, 8).map((keyword, index) => {
    const sourceSentence = sentences.find((sentence) => sentence.toLowerCase().includes(keyword.toLowerCase())) ?? sentences[index % Math.max(sentences.length, 1)] ?? "";

    return {
      id: `card-${Date.now()}-${index}`,
      front: `What should you remember about ${keyword}?`,
      back: sourceSentence || `${keyword} is one of the central concepts in this material.`,
      topic: keyword,
      difficulty: index < 2 ? "easy" : index < 6 ? "medium" : "hard",
      sourceDocument
    };
  });
}

export function generateQuiz(text: string): GeneratedQuizQuestion[] {
  const keywords = extractKeywords(text, 8);
  const sentences = splitSentences(text);
  const distractors = keywords.length >= 4 ? keywords : ["definition", "example", "process", "evidence"];

  return keywords.slice(0, 6).map((keyword, index) => {
    const answer = keyword;
    const options = unique([answer, ...distractors.filter((item) => item !== answer).slice(0, 3)]).slice(0, 4);
    const explanation = sentences.find((sentence) => sentence.toLowerCase().includes(keyword.toLowerCase())) ?? "Review the source summary and related chunks for this concept.";

    return {
      id: `quiz-${Date.now()}-${index}`,
      type: "multiple_choice",
      question: `Which concept best matches this study focus: "${explanation.slice(0, 120)}..."?`,
      options: shuffle(options),
      answer,
      explanation,
      topic: keyword
    };
  });
}

export function retrieveContext(query: string, chunks: Array<{ content: string; documentName?: string }>, limit = 4) {
  const terms = tokenize(query);

  return chunks
    .map((chunk) => {
      const normalizedContent = normalizeForSearch(chunk.content);
      const score = terms.reduce((sum, term) => {
        if (normalizedContent.includes(term)) {
          return sum + 3;
        }

        return sum + relatedTerms(term).filter((related) => normalizedContent.includes(related)).length;
      }, 0);

      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function answerFromContext(query: string, context: Array<{ content: string; documentName?: string }>, language: "en" | "es" = "es") {
  if (context.length === 0) {
    return language === "es"
      ? "No encontre una fuente directa en tus documentos para esa pregunta. Puedo ayudarte a reformularla o puedes subir mas material relacionado."
      : "I could not find a direct source in your documents for that question. I can help you rephrase it, or you can upload more related material.";
  }

  const queryTerms = tokenize(query);
  const snippets = context.map((item) => bestEvidenceSnippet(item.content, queryTerms));
  const citations = context.map((item, index) => `[${index + 1}] ${item.documentName ?? "Uploaded source"}`);
  const lead = language === "es" ? "Segun tus materiales:" : "Based on your materials:";
  const explanation =
    language === "es"
      ? "La respuesta se sostiene en estas ideas clave de tus fuentes. Primero ubica los conceptos principales, luego conectalos en una explicacion corta y practica:"
      : "The answer is grounded in these key ideas from your sources. First identify the main concepts, then connect them into a short practical explanation:";
  const studyMove =
    language === "es"
      ? "Movimiento de estudio: despues de leerlo, intenta explicarlo sin mirar los apuntes y comprueba si mencionas los mismos conceptos clave."
      : "Study move: after reading this, explain it without looking at the notes and check whether you mention the same key concepts.";

  return `${lead}\n\n${explanation}\n\n${snippets
    .map((snippet, index) => `${index + 1}. ${snippet} [${index + 1}]`)
    .join("\n")}\n\n${studyMove}\n\nSources: ${citations.join("; ")}`;
}

export function generateStudyPlan(input: {
  documents: Array<{ name: string; text: string; summary?: string; quiz?: GeneratedQuizQuestion[] }>;
  language?: "en" | "es";
  days?: number;
}) {
  const language = input.language ?? "es";
  const days = Math.max(3, Math.min(input.days ?? 7, 21));
  const sourceText = input.documents.map((document) => `${document.name}\n${document.summary ?? document.text}`).join("\n\n");
  const topics = extractKeywords(sourceText, Math.min(days + 3, 12));
  const weakTopics = input.documents.flatMap((document) => document.quiz?.map((question) => question.topic) ?? []).slice(0, 6);

  if (input.documents.length === 0) {
    return language === "es"
      ? "Sube al menos un material para generar un plan de estudio basado en tus fuentes."
      : "Upload at least one material to generate a source-based study plan.";
  }

  const title = language === "es" ? "Plan de estudio personalizado" : "Personalized study plan";
  const intro =
    language === "es"
      ? `Basado en ${input.documents.length} material(es) subido(s), trabaja en sesiones cortas y activas.`
      : `Based on ${input.documents.length} uploaded material(s), use short active-study sessions.`;
  const daily = Array.from({ length: days }, (_, index) => {
    const topic = topics[index % Math.max(topics.length, 1)] ?? (language === "es" ? "conceptos clave" : "key concepts");
    const source = input.documents[index % input.documents.length]?.name ?? "source";
    const activity =
      index % 3 === 0
        ? language === "es"
          ? "Lee el resumen y crea 3 preguntas propias."
          : "Read the summary and create 3 questions in your own words."
        : index % 3 === 1
          ? language === "es"
            ? "Repasa tarjetas y marca las dificiles."
            : "Review flashcards and mark difficult ones."
          : language === "es"
            ? "Haz un mini quiz y corrige errores."
            : "Take a mini quiz and correct mistakes.";

    return `${language === "es" ? "Dia" : "Day"} ${index + 1}: ${topic} (${source}) - ${activity}`;
  });

  const finalLine =
    language === "es"
      ? `Temas a vigilar: ${(weakTopics.length ? unique(weakTopics) : topics.slice(0, 4)).join(", ")}.`
      : `Watch topics: ${(weakTopics.length ? unique(weakTopics) : topics.slice(0, 4)).join(", ")}.`;

  return `## ${title}\n\n${intro}\n\n${daily.map((item) => `- ${item}`).join("\n")}\n\n${finalLine}`;
}

export function buildChunks(text: string) {
  return chunkText(text, 2600, 420);
}

function splitSentences(text: string) {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40)
    .slice(0, 40);
}

function extractKeywords(text: string, limit: number) {
  const counts = new Map<string, number>();

  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => titleCase(word))
    .slice(0, limit);
}

function tokenize(text: string) {
  return normalizeForSearch(text)
    .match(/[a-z0-9]{4,}/g)
    ?.filter((word) => !stopWords.has(word)) ?? [];
}

function normalizeForSearch(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function bestEvidenceSnippet(content: string, queryTerms: string[]) {
  const sentences = splitSentences(content);
  const ranked = sentences
    .map((sentence) => {
      const normalized = normalizeForSearch(sentence);
      const score = queryTerms.reduce((sum, term) => sum + (normalized.includes(term) ? 1 : 0), 0);
      return { sentence, score };
    })
    .sort((a, b) => b.score - a.score);
  const selected = ranked.filter((item) => item.score > 0).slice(0, 2);
  const fallback = sentences.slice(0, 2).map((sentence) => ({ sentence, score: 0 }));
  const snippet = (selected.length ? selected : fallback).map((item) => item.sentence).join(" ");

  return snippet.slice(0, 520).trim();
}

function relatedTerms(term: string) {
  const groups = [
    ["humana", "humanos", "humanidad", "hominidos", "homininos", "homo"],
    ["evolucion", "evolutivo", "evolutiva", "evolucionar", "adaptacion"],
    ["respiracion", "mitocondria", "mitocondrias", "atp", "oxidativa"],
    ["celular", "celula", "celulas", "membrana"],
    ["transporte", "difusion", "osmosis", "gradiente"]
  ];
  const match = groups.find((group) => group.includes(term));

  return match?.filter((item) => item !== term) ?? [];
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}
