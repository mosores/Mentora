import type { ChunkRecord, SourceCitation, ToolType } from "@/lib/types";

const stopWords = new Set([
  "about",
  "after",
  "also",
  "because",
  "before",
  "between",
  "could",
  "desde",
  "donde",
  "estas",
  "estos",
  "para",
  "pero",
  "sobre",
  "their",
  "there",
  "these",
  "those",
  "through",
  "where",
  "which",
  "while",
  "with",
  "would"
]);

export function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeForSearch(text: string) {
  return normalizeText(text)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function extractKeywords(text: string, limit = 14) {
  const normalized = normalizeForSearch(text);
  const counts = new Map<string, number>();
  const words = normalized.match(/[a-z0-9áéíóúñü]{4,}/gi) ?? [];

  for (const word of words) {
    if (stopWords.has(word)) {
      continue;
    }

    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}

export function chunkSourceText(text: string) {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  const chunkSize = 150;
  const overlap = 24;

  for (let start = 0; start < words.length; start += chunkSize - overlap) {
    const chunk = words.slice(start, start + chunkSize).join(" ");

    if (chunk.length >= 80) {
      chunks.push(chunk);
    }

    if (start + chunkSize >= words.length) {
      break;
    }
  }

  return chunks.length > 0 ? chunks : [normalizeText(text)];
}

function splitSentences(text: string) {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 40);
}

export function summarizeText(text: string, maxSentences = 4) {
  const sentences = splitSentences(text);

  if (sentences.length === 0) {
    return normalizeText(text).slice(0, 500);
  }

  const selected = sentences.slice(0, maxSentences);
  return selected.join(" ");
}

export function retrieveRelevantChunks(query: string, chunks: ChunkRecord[], limit = 4) {
  const terms = new Set(extractKeywords(query, 16));
  const normalizedQuery = normalizeForSearch(query);

  return chunks
    .map((chunk) => {
      const searchable = `${normalizeForSearch(chunk.text)} ${chunk.keywords.join(" ")}`;
      let score = 0;

      for (const term of terms) {
        if (searchable.includes(term)) {
          score += chunk.keywords.includes(term) ? 3 : 1;
        }
      }

      if (normalizedQuery.length > 12 && searchable.includes(normalizedQuery.slice(0, 48))) {
        score += 4;
      }

      return { chunk, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.chunk);
}

function isAcademicBypassRequest(message: string) {
  return /(?:write|do|answer|solve).*(?:for me|my exam|my quiz|my assignment|mi tarea|mi examen)|(?:cheat|plagiar|copiar|hacer mi tarea)/i.test(
    message
  );
}

function citeLabel(citation: SourceCitation) {
  return `${citation.sourceName}, chunk ${citation.chunkIndex}`;
}

export function localTutorAnswer(message: string, chunks: ChunkRecord[]) {
  const relevant = retrieveRelevantChunks(message, chunks);

  if (isAcademicBypassRequest(message)) {
    return {
      answer:
        "I can help you learn it, but I cannot complete assessed work for you. Send the exact concept you are stuck on and I will walk you through the reasoning step by step, using your uploaded sources.",
      citations: [] as SourceCitation[]
    };
  }

  if (relevant.length === 0) {
    return {
      answer:
        "I could not find a relevant passage in this study space. Try uploading the class notes for this topic, or ask a narrower question using terms from your material.",
      citations: [] as SourceCitation[]
    };
  }

  const evidence = relevant
    .map((chunk, index) => {
      const sentence = splitSentences(chunk.text)[0] ?? chunk.text.slice(0, 220);
      return `${index + 1}. ${sentence}`;
    })
    .join("\n");

  const citations = relevant.map(({ documentId, sourceName, chunkIndex }) => ({ documentId, sourceName, chunkIndex }));
  const citationLine = citations.map(citeLabel).join("; ");

  return {
    answer: `Here is the grounded answer from your material:\n\n${evidence}\n\nUse this as your study anchor: explain the main idea in your own words, then connect it back to the source detail. Sources: ${citationLine}.`,
    citations
  };
}

export function buildToolContent(type: ToolType, chunks: ChunkRecord[]) {
  const combined = chunks.map((chunk) => chunk.text).join("\n\n");
  const keywords = extractKeywords(combined, 20);
  const sentences = splitSentences(combined);

  if (type === "summary") {
    return {
      overview: summarizeText(combined, 5),
      keyTerms: keywords.slice(0, 10),
      sourceCount: new Set(chunks.map((chunk) => chunk.documentId)).size
    };
  }

  if (type === "flashcards") {
    return sentences.slice(0, 8).map((sentence, index) => {
      const term = keywords[index] ?? `concept ${index + 1}`;
      return {
        front: `Explain ${term}`,
        back: sentence
      };
    });
  }

  if (type === "quiz") {
    return sentences.slice(0, 6).map((sentence, index) => {
      const answer = keywords[index] ?? "the source concept";
      return {
        question: `According to your material, what should you remember about ${answer}?`,
        options: [
          sentence,
          "It is unrelated to the uploaded source.",
          "It only matters outside this course context.",
          "The source says there is not enough information."
        ],
        answerIndex: 0
      };
    });
  }

  return [
    {
      day: 1,
      task: "Skim the uploaded material and mark unfamiliar terms.",
      focus: keywords.slice(0, 4)
    },
    {
      day: 2,
      task: "Rewrite the summary from memory, then compare it with the source.",
      focus: keywords.slice(4, 8)
    },
    {
      day: 3,
      task: "Answer flashcards aloud and explain each answer without reading.",
      focus: keywords.slice(8, 12)
    },
    {
      day: 4,
      task: "Take the generated quiz and review every missed explanation.",
      focus: keywords.slice(12, 16)
    },
    {
      day: 5,
      task: "Teach the topic in five minutes and cite the uploaded source details.",
      focus: keywords.slice(16, 20)
    }
  ];
}

export function toolTitle(type: ToolType) {
  const titles: Record<ToolType, string> = {
    summary: "Source Summary",
    flashcards: "Practice Flashcards",
    quiz: "Source Quiz",
    plan: "Five-Day Study Plan"
  };

  return titles[type];
}
