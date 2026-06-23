/**
 * Academic Integrity Safety Layer
 *
 * Screens incoming tutor chat messages for patterns that suggest
 * the student is attempting to use the AI to cheat rather than learn.
 *
 * On a match, we block the request and redirect toward legitimate study help.
 */

const blockedPatterns = [
  /\bactive exam\b/i,
  /\blive exam\b/i,
  /\bgive me the answers\b/i,
  /\bbypass plagiarism\b/i,
  /\bwrite my whole assignment\b/i,
  /\bdo my homework for me\b/i,
  /\bcomplete my assignment\b/i,
  /\bwrite the essay for me\b/i,
  /\bsolve the exam\b/i,
  /\banswers to the test\b/i,
  /\bcopy this assignment\b/i,
  /\bplagiarism check\b/i,
  /\bundetectable (ai|writing)\b/i,
  /\bhaz(me|lo) (la|el) tarea\b/i,
  /\bresuelve el examen\b/i,
  /\brespuestas del (examen|parcial|final)\b/i,
  /\bescribe (mi|la) tarea\b/i,
];

const studyRedirects = [
  "I can help you understand this topic step-by-step — what concept feels most unclear?",
  "Instead of answering directly, let me help you reason through it. What do you already know about this?",
  "I can build you a practice quiz on this topic, or explain the concept with an analogy. Which would help more?",
  "Academic work is yours to do. I can explain the theory, give you an outline structure, or review your draft instead.",
];

export function screenAcademicIntegrityRequest(message: string) {
  const blocked = blockedPatterns.some((pattern) => pattern.test(message));

  if (!blocked) {
    return { allowed: true };
  }

  const redirect =
    studyRedirects[Math.floor(Math.random() * studyRedirects.length)];

  return {
    allowed: false,
    redirect:
      `I'm here to help you learn — not to bypass the academic process. ${redirect}`
  };
}
