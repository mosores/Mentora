export type TextChunk = {
  content: string;
  index: number;
  tokenEstimate: number;
};

export function chunkText(text: string, maxChars = 3200, overlapChars = 500): TextChunk[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxChars, normalized.length);
    const content = normalized.slice(start, end).trim();

    if (content) {
      chunks.push({
        content,
        index: chunks.length,
        tokenEstimate: Math.ceil(content.length / 4)
      });
    }

    if (end === normalized.length) {
      break;
    }

    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks;
}
