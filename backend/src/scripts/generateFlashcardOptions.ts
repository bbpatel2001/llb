import 'dotenv/config';
import mongoose from 'mongoose';
import { Flashcard } from '../models/Flashcard';
import { Question } from '../models/Question';

const GROQ_MODEL = 'openai/gpt-oss-20b';
const BATCH_SIZE = 5;
const SUBJECTS = ['CONSTITUTIONAL', 'CONTRACT', 'CRIMINAL', 'TORTS'];

type OptionCandidate = {
  label: string;
  text: string;
  explanation: string;
};

type GeneratedCandidate = {
  id: string;
  options: OptionCandidate[];
  correctAnswer: string;
  explanation: string;
};

type GenerationInput = {
  id: string;
  subject: string;
  topic: string;
  question: string;
  flashcardFront: string;
};

function parseModelJson(content: string): unknown {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!objectMatch) throw new Error('Model response did not contain a JSON object');
    return JSON.parse(objectMatch[0]);
  }
}

function validateCandidate(candidate: unknown, expectedId: string): GeneratedCandidate {
  const value = (candidate || {}) as Record<string, unknown>;
  if (String(value.id || '') !== expectedId) throw new Error(`Candidate ID mismatch for ${expectedId}`);
  if (!Array.isArray(value.options) || value.options.length !== 4) throw new Error(`Expected exactly four options for ${expectedId}`);

  const options = value.options.map((rawOption) => {
    const option = (rawOption || {}) as Record<string, unknown>;
    return {
      label: String(option.label || '').trim().toUpperCase(),
      text: String(option.text || '').trim(),
      explanation: String(option.explanation || '').trim(),
    };
  });
  const labels = options.map((option) => option.label);
  const texts = options.map((option) => option.text.toLowerCase().replace(/\s+/g, ' '));
  if (labels.join(',') !== 'A,B,C,D') throw new Error(`Options must be labelled A, B, C and D for ${expectedId}`);
  if (new Set(texts).size !== 4 || options.some((option) => option.text.length < 8 || option.explanation.length < 20)) {
    throw new Error(`Options or explanations are incomplete for ${expectedId}`);
  }

  const correctAnswer = String(value.correctAnswer || '').trim().toUpperCase();
  if (!labels.includes(correctAnswer)) throw new Error(`Correct answer is not one of A-D for ${expectedId}`);
  const explanation = String(value.explanation || '').trim();
  if (explanation.length < 20) throw new Error(`Overall explanation is incomplete for ${expectedId}`);

  return { id: expectedId, options, correctAnswer, explanation };
}

function normalizeLabel(value: string): string {
  return value.trim().toUpperCase().replace(/[.)]$/, '');
}

function randomizeCandidateOptions(candidate: GeneratedCandidate): GeneratedCandidate {
  const options = [...candidate.options];
  let seed = Array.from(candidate.id).reduce(
    (total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0,
    13,
  );

  for (let index = options.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }

  const correctIndex = options.findIndex((option) => normalizeLabel(option.label) === normalizeLabel(candidate.correctAnswer));
  if (correctIndex < 0) return candidate;

  return {
    ...candidate,
    options: options.map((option, index) => ({ ...option, label: String.fromCharCode(65 + index) })),
    correctAnswer: String.fromCharCode(65 + correctIndex),
  };
}

async function callGroq(batch: GenerationInput[]): Promise<GeneratedCandidate[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is required to generate flashcard options');

  const prompt = `You are preparing draft multiple-choice study checks for Indian LL.B. students.
Generate one candidate for every item below. The question stems are syllabus-oriented prompts, not official answer keys.

Rules:
- Return JSON only in the shape {"items":[...]}.
- Return exactly one item for every supplied id.
- Each item must have exactly four options labelled A, B, C and D.
- Options must test the same legal learning objective as the supplied question.
- Exactly one option must be the best answer; set correctAnswer to its label.
- Give a specific explanation for every option. For a wrong option, explain the legal misconception, missing element, limitation, or factual error; never only say “incorrect”.
- Give an overall explanation that states the governing reasoning.
- Do not use “all of the above”, “none of the above”, trick wording, or duplicate options.
- Do not invent case names, section numbers, quotations, or dates. If a precise authority is uncertain, explain the general doctrine without a citation.
- These are draft candidates and must be suitable for later legal/editorial review.

Items:
${JSON.stringify(batch, null, 2)}

Required JSON shape:
{"items":[{"id":"...","options":[{"label":"A","text":"...","explanation":"..."},{"label":"B","text":"...","explanation":"..."},{"label":"C","text":"...","explanation":"..."},{"label":"D","text":"...","explanation":"..."}],"correctAnswer":"A","explanation":"..."}]}`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Return only valid JSON. You are generating reviewable educational content, not final legal advice.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 1800,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    if (response.status === 429) throw new Error(`RATE_LIMIT: ${details}`);
    throw new Error(`Groq request failed: ${response.status} ${details}`);
  }
  const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq response did not contain message content');
  const parsed = parseModelJson(content) as { items?: unknown[] };
  if (!Array.isArray(parsed.items) || parsed.items.length !== batch.length) {
    throw new Error(`Groq returned ${parsed.items?.length || 0} items for ${batch.length} inputs`);
  }

  const byId = new Map<string, GeneratedCandidate>();
  for (const rawCandidate of parsed.items) {
    const rawId = String((rawCandidate as Record<string, unknown>)?.id || '');
    if (!rawId || byId.has(rawId)) throw new Error('Groq returned duplicate or missing candidate IDs');
    byId.set(rawId, validateCandidate(rawCandidate, rawId));
  }

  return batch.map((item) => {
    const candidate = byId.get(item.id);
    if (!candidate) throw new Error(`Groq omitted candidate ${item.id}`);
    return candidate;
  });
}

async function generateWithRetry(batch: GenerationInput[]): Promise<GeneratedCandidate[]> {
  try {
    return await callGroq(batch);
  } catch (error) {
    const message = (error as Error).message;
    if (message.startsWith('RATE_LIMIT:')) {
      console.warn('Groq rate limit reached; waiting 20 seconds before retrying the same batch.');
      await new Promise((resolve) => setTimeout(resolve, 20_000));
      return generateWithRetry(batch);
    }
    if (batch.length === 1) throw error;
    const midpoint = Math.ceil(batch.length / 2);
    console.warn(`Retrying failed batch of ${batch.length}: ${message}`);
    const left = await generateWithRetry(batch.slice(0, midpoint));
    const right = await generateWithRetry(batch.slice(midpoint));
    return [...left, ...right];
  }
}

async function main(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/llb');
  try {
    const requestedFront = process.env.FLASHCARD_FRONT?.trim().toLowerCase();
    const questionQuery: Record<string, unknown> = {
      semester: 1,
      subject: { $in: SUBJECTS },
    };
    if (!requestedFront) questionQuery.tags = 'GENERATED_SYLLABUS';
    const questions = await Question.find(questionQuery).select('_id subject questionText tags').lean();
    const questionIds = questions.map((question) => question._id);
    const cards = await Flashcard.find({ sourceQuestionId: { $in: questionIds }, isActive: true })
      .select('_id sourceQuestionId front options optionSource')
      .lean();
    const questionsById = new Map(questions.map((question) => [String(question._id), question]));
    const inputs: GenerationInput[] = cards
      .filter((card) => !(card.optionSource === 'ai-generated-draft' && Array.isArray(card.options) && card.options.length === 4))
      .filter((card) => !requestedFront || card.front.trim().toLowerCase() === requestedFront)
      .map((card) => {
      const question = questionsById.get(String(card.sourceQuestionId));
      if (!question) throw new Error(`Missing source question for flashcard ${card._id}`);
      return {
        id: String(card._id),
        subject: question.subject,
        topic: question.tags.find((tag) => tag.startsWith('s1-')) || 'Semester 1 syllabus topic',
        question: question.questionText,
        flashcardFront: card.front,
      };
    });

    if (inputs.length === 0) throw new Error('No active syllabus-generated flashcards were found');
    console.log(`Generating options for ${inputs.length} cards in batches of ${BATCH_SIZE} using ${GROQ_MODEL}`);

    let updated = 0;
    for (let index = 0; index < inputs.length; index += BATCH_SIZE) {
      const batch = inputs.slice(index, index + BATCH_SIZE);
      const candidates = (await generateWithRetry(batch)).map(randomizeCandidateOptions);
      const generatedAt = new Date();
      await Flashcard.collection.bulkWrite(candidates.map((candidate) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(candidate.id) },
          update: {
            $set: {
              options: candidate.options,
              correctAnswer: candidate.correctAnswer,
              explanation: candidate.explanation,
              optionSource: 'ai-generated-draft',
              optionStatus: 'needs_review',
              optionModel: GROQ_MODEL,
              optionGeneratedAt: generatedAt,
            },
          },
        },
      })));
      updated += candidates.length;
      console.log(`Updated ${updated}/${inputs.length} flashcards`);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    console.log(JSON.stringify({ requested: inputs.length, updated, optionSource: 'ai-generated-draft', optionStatus: 'needs_review' }));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
