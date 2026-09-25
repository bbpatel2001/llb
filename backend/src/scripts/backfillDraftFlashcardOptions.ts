import 'dotenv/config';
import mongoose from 'mongoose';
import { Flashcard, FlashcardDeck } from '../models/Flashcard';

const DEFAULT_SUBJECTS = ['CONSTITUTIONAL', 'CONTRACT', 'CRIMINAL', 'TORTS', 'GENERAL'];

function isReadableFlashcardText(value: unknown): boolean {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  const letterCount = (text.match(/[A-Za-z]/g) || []).length;
  const nonWordCount = (text.match(/[^\p{L}\p{N}\s.,?'’():;\-\/]/gu) || []).length;
  const nonAsciiCount = (text.match(/[^\x00-\x7F]/g) || []).length;
  const mixedAlphaNumericTokens = text
    .split(/\s+/)
    .filter((token) => /[A-Za-z]/.test(token) && /\d/.test(token)).length;

  return Boolean(
    text.length >= 20
      && letterCount >= 10
      && mixedAlphaNumericTokens <= 1
      && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uE000-\uF8FF\uFFFD]/u.test(text)
      && nonAsciiCount / text.length <= 0.4
      && nonWordCount / text.length <= 0.2
  );
}

function hasCompleteOptionSet(card: {
  options?: Array<{ label?: string; text?: string; explanation?: string }>;
  correctAnswer?: string;
}): boolean {
  if (!Array.isArray(card.options) || card.options.length !== 4 || !card.correctAnswer?.trim()) return false;
  const labels = card.options.map((option) => option.label?.trim().toUpperCase() || '');
  return labels.join(',') === 'A,B,C,D'
    && card.options.every((option) => Boolean(option.text?.trim()) && Boolean(option.explanation?.trim()));
}

async function main(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/llb');
  try {
    const requestedSubject = process.env.FLASHCARD_SUBJECT?.trim().toUpperCase();
    const subjects = requestedSubject ? [requestedSubject] : DEFAULT_SUBJECTS;
    const decks = await FlashcardDeck.find({ semester: 1, subject: { $in: subjects } }).select('_id').lean();
    const cards = await Flashcard.find({
      deckId: { $in: decks.map((deck) => deck._id) },
      isActive: true,
    }).select('_id front back options correctAnswer optionSource').lean();
    const readableCards = cards.filter((card) => isReadableFlashcardText(card.front) && isReadableFlashcardText(card.back));
    const invalidCards = readableCards.filter((card) => (
      card.optionSource === 'rule-generated-draft' || !hasCompleteOptionSet(card)
    ));

    if (invalidCards.length > 0) {
      await Flashcard.collection.bulkWrite(invalidCards.map((card) => ({
        updateOne: {
          filter: { _id: card._id },
          update: {
            $unset: {
              options: 1,
              correctAnswer: 1,
              explanation: 1,
              optionSource: 1,
              optionStatus: 1,
              optionModel: 1,
              optionGeneratedAt: 1,
            },
          },
        },
      })));
    }

    console.log(JSON.stringify({
      subjects,
      totalActiveCards: cards.length,
      readableCards: readableCards.length,
      skippedUnreadable: cards.length - readableCards.length,
      validOptionSets: readableCards.length - invalidCards.length,
      clearedInvalidOptions: invalidCards.length,
      reason: 'Only question-specific verified or AI-generated options may be used as MCQs.',
    }));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
