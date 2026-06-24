/**
 * Emergency Safety Limits for Mentora.
 * Helps prevent memory overload, slow queries, and local development system crashes.
 */
export const SAFETY_LIMITS = {
  // PDF Upload limits
  MAX_PDF_BYTES_DEV: 20 * 1024 * 1024, // 20 MB local limit
  MAX_PDF_BYTES_PROD: 50 * 1024 * 1024, // 50 MB production limit
  
  // Page limits
  MAX_PAGES_DEV: 40,                     // 40 pages local limit
  MAX_PAGES_PROD: 100,                   // 100 pages production limit
  
  // Chunking limits
  MAX_CHUNKS_PER_DOC: 300,               // Max chunks per document
  CHUNK_SIZE_TOKENS: 700,                // Semantic chunk size target (tokens)
  CHUNK_OVERLAP_TOKENS: 100,             // Overlap target (tokens)
  
  // Citation / Chat context limits
  MAX_CITATIONS_PER_ANSWER: 5,           // Target citations per chat response (4 to 6)
  MAX_CHARACTERS_PER_CITATION: 1000,     // Max characters per citation (800 to 1200)

  // Timeouts (in milliseconds)
  PDF_PROCESSING_TIMEOUT: 3 * 60 * 1000, // 3 minutes timeout for background worker
  RAG_RETRIEVAL_TIMEOUT: 3 * 1000,       // 3 seconds limit for pgvector query
  FIRST_TOKEN_TIMEOUT: 15 * 1000,        // 15 seconds limit for model streaming start
};

export function getPdfMaxBytes(): number {
  return process.env.NODE_ENV === "production"
    ? SAFETY_LIMITS.MAX_PDF_BYTES_PROD
    : SAFETY_LIMITS.MAX_PDF_BYTES_DEV;
}

export function getPdfMaxPages(): number {
  return process.env.NODE_ENV === "production"
    ? SAFETY_LIMITS.MAX_PAGES_PROD
    : SAFETY_LIMITS.MAX_PAGES_DEV;
}
