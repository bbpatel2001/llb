/**
 * Removes extraction noise from a stored question without removing the actual
 * question or its OR alternative. Marks are stored separately on Question.
 */
export function cleanStoredQuestionText(value: string): string {
  if (!value) return '';

  return value
    .replace(/\r/g, '\n')
    .replace(/(?:^|\s)(?:Page|Foundation|Register No\.?|Seat No\.?|Time|Maximum)\s*[:\-]?[^\n]*/gi, ' ')
    .replace(/[_]{4,}/g, ' ')
    .replace(/(?:\/grealsir\/|@grealsir|@GRealsir)/gi, ' ')
    .replace(/\s+\d{1,3}\s+(?=OR\b)/gi, ' ')
    .replace(/\s+\d{1,3}\s*$/g, '')
    .replace(/\s+\d{1,3}\s+(?=\(?[A-H]\)\s)/gi, ' ')
    .replace(/\s+\d{1,3}\s+[a-z]\s+(?=OR\b)/gi, ' ')
    .replace(/\s+[a-z]\s+(?=OR\b)/gi, ' ')
    .replace(/^\s*(?:Q(?:uestion)?\s*)?\d+[.)]\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function answerPlanForMarks(marks: number): { type: 'short' | 'long'; pages: string; words: string } {
  if (marks <= 5) return { type: 'short', pages: 'approximately 1 A4 page', words: '350–500 words' };
  if (marks <= 15) return { type: 'long', pages: 'approximately 3 A4 pages', words: '900–1,200 words' };
  return { type: 'long', pages: 'approximately 4–5 A4 pages', words: '1,600–2,200 words' };
}
