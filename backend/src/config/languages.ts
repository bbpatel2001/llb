export const SUPPORTED_ANSWER_LANGUAGES = ['en', 'gu'] as const;
export type AnswerLanguage = (typeof SUPPORTED_ANSWER_LANGUAGES)[number];

export function isAnswerLanguage(value: unknown): value is AnswerLanguage {
  return value === 'en' || value === 'gu';
}

export function getAnswerLanguage(value: unknown): AnswerLanguage {
  return isAnswerLanguage(value) ? value : 'en';
}
