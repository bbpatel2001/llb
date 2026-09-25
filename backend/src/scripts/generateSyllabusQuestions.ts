import 'dotenv/config';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ContentGenerationService } from '../services/contentGenerationService';
import { Question } from '../models/Question';
import { Paper } from '../models/Paper';
import { QuestionDeduplicationService } from '../services/questionDeduplicationService';
import { semester1SyllabusBlueprint, Semester1SubjectBlueprint } from '../data/semester1SyllabusBlueprint';

const TARGET_PER_SUBJECT = 260;
const SOURCE_FILE_PREFIX = 'semester1-syllabus-working-blueprint-v1';
const GENERATED_YEAR = 2026;

const questionFamilies: Array<{
  build: (topic: string, subject: string) => string;
  type: 'SHORT' | 'LONG' | 'CASE_STUDY' | 'DESCRIPTIVE';
  marks: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}> = [
  {
    build: (topic, subject) => `Define ${topic} and explain its significance in ${subject} law.`,
    type: 'SHORT',
    marks: 5,
    difficulty: 'EASY',
  },
  {
    build: (topic) => `Explain the essential elements and legal requirements of ${topic}.`,
    type: 'DESCRIPTIVE',
    marks: 10,
    difficulty: 'MEDIUM',
  },
  {
    build: (topic) => `Discuss the statutory, constitutional and common-law foundation of ${topic} in India.`,
    type: 'LONG',
    marks: 15,
    difficulty: 'MEDIUM',
  },
  {
    build: (topic) => `How should a court analyse a dispute involving ${topic}? Explain the relevant issues in sequence.`,
    type: 'CASE_STUDY',
    marks: 10,
    difficulty: 'HARD',
  },
  {
    build: (topic, subject) => `Apply the principles of ${topic} to a hypothetical problem involving competing rights or duties in ${subject} law.`,
    type: 'CASE_STUDY',
    marks: 15,
    difficulty: 'HARD',
  },
  {
    build: (topic) => `Discuss the principal limitations, exceptions and defences relating to ${topic}.`,
    type: 'DESCRIPTIVE',
    marks: 10,
    difficulty: 'MEDIUM',
  },
  {
    build: (topic, subject) => `Examine the relationship between ${topic} and the broader objectives of ${subject} law.`,
    type: 'LONG',
    marks: 15,
    difficulty: 'MEDIUM',
  },
  {
    build: (topic) => `Discuss how Indian courts have developed and applied the law relating to ${topic}.`,
    type: 'LONG',
    marks: 15,
    difficulty: 'HARD',
  },
  {
    build: (topic) => `Write a structured examination note on ${topic}, including its definition, elements, authorities and conclusion.`,
    type: 'SHORT',
    marks: 5,
    difficulty: 'EASY',
  },
  {
    build: (topic) => `Critically evaluate the contemporary relevance and unresolved legal issues concerning ${topic}.`,
    type: 'LONG',
    marks: 15,
    difficulty: 'HARD',
  },
  {
    build: (topic, subject) => `Compare the operation of ${topic} with a related doctrine commonly studied in ${subject} law.`,
    type: 'DESCRIPTIVE',
    marks: 10,
    difficulty: 'MEDIUM',
  },
  {
    build: (topic) => `Identify the key ingredients that must be proved before a claim based on ${topic} can succeed.`,
    type: 'SHORT',
    marks: 5,
    difficulty: 'EASY',
  },
];

function fingerprint(text: string): string {
  return crypto.createHash('sha256').update(text.toLowerCase().replace(/\s+/g, ' ').trim()).digest('hex');
}

function topicKey(subjectCode: string, topicIndex: number): string {
  return `${subjectCode.toLowerCase()}.t${topicIndex + 1}`;
}

async function ensureGeneratedPaper(blueprint: Semester1SubjectBlueprint): Promise<any> {
  const fileName = `${SOURCE_FILE_PREFIX}-${blueprint.subject.toLowerCase()}.json`;
  return Paper.findOneAndUpdate(
    { fileName },
    {
      $set: {
        semester: 1,
        subject: blueprint.subject,
        title: `Semester 1 ${blueprint.subject} syllabus question bank`,
        year: GENERATED_YEAR,
        university: 'OTHER',
        sourcePath: 'backend/src/data/semester1SyllabusBlueprint.ts',
        reviewStatus: 'draft',
        status: 'COMPLETED',
        questionsExtracted: true,
      },
      $setOnInsert: {
        fileName,
        sourceSha256: fingerprint(`${SOURCE_FILE_PREFIX}:${blueprint.subject}`),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
}

async function generateSubject(blueprint: Semester1SubjectBlueprint): Promise<{ subject: string; added: number; total: number }> {
  const paper = await ensureGeneratedPaper(blueprint);
  const existingQuestions = await Question.find({ semester: 1, subject: blueprint.subject }).select('questionText paperId sourceFingerprint').lean();
  const normalizedExisting = new Set(existingQuestions.map((question) => QuestionDeduplicationService.normalizeQuestionText(question.questionText)).filter(Boolean));
  const existingGenerated = new Set(
    existingQuestions
      .filter((question) => String(question.paperId) === String(paper._id))
      .map((question) => question.sourceFingerprint)
      .filter((value): value is string => Boolean(value))
  );
  const existingGeneratedByFingerprint = new Map(
    existingQuestions
      .filter((question) => String(question.paperId) === String(paper._id) && question.sourceFingerprint)
      .map((question) => [question.sourceFingerprint as string, question])
  );

  const candidates: Array<{ questionText: string; topic: string; topicKey: string; familyIndex: number }> = [];
  for (let topicIndex = 0; topicIndex < blueprint.topics.length; topicIndex += 1) {
    const topic = blueprint.topics[topicIndex];
    for (let familyIndex = 0; familyIndex < questionFamilies.length; familyIndex += 1) {
      const questionText = questionFamilies[familyIndex].build(topic, blueprint.subject);
      candidates.push({ questionText, topic, topicKey: topicKey(blueprint.subjectCode, topicIndex), familyIndex });
    }
  }

  await Question.collection.bulkWrite(candidates.map((candidate) => ({
    updateOne: {
      filter: { sourceFingerprint: fingerprint(`${SOURCE_FILE_PREFIX}:${blueprint.subject}:${candidate.topicKey}:${candidate.familyIndex}`) },
      update: {
        $set: {
          questionText: candidate.questionText,
          rawText: candidate.questionText,
          validationIssues: ['generated-from-working-syllabus-blueprint', 'requires-editorial-review'],
        },
      },
    },
  })));

  let added = 0;
  for (const candidate of candidates) {
    if (existingGenerated.size + added >= TARGET_PER_SUBJECT) break;
    const normalized = QuestionDeduplicationService.normalizeQuestionText(candidate.questionText);
    const sourceFingerprint = fingerprint(`${SOURCE_FILE_PREFIX}:${blueprint.subject}:${candidate.topicKey}:${candidate.familyIndex}`);
    const existingGeneratedQuestion = existingGeneratedByFingerprint.get(sourceFingerprint);
    if (existingGeneratedQuestion) {
      if (existingGeneratedQuestion.questionText !== candidate.questionText) {
        await Question.collection.updateOne({ sourceFingerprint }, {
          $set: {
            questionText: candidate.questionText,
            rawText: candidate.questionText,
            validationIssues: ['generated-from-working-syllabus-blueprint', 'requires-editorial-review'],
          },
        });
      }
      continue;
    }
    if (!normalized || normalized.length < 30 || normalizedExisting.has(normalized)) continue;

    const family = questionFamilies[candidate.familyIndex];
    const createdQuestion = await Question.create({
      paperId: paper._id,
      semester: 1,
      subject: blueprint.subject,
      questionNumber: `SYL-${blueprint.subjectCode}-${String(added + 1).padStart(3, '0')}`,
      questionText: candidate.questionText,
      marks: family.marks,
      type: family.type,
      difficulty: family.difficulty,
      tags: ['SEM1_SYLLABUS', 'GENERATED_SYLLABUS', candidate.topicKey],
      source: {
        fileName: `${SOURCE_FILE_PREFIX}-${blueprint.subject.toLowerCase()}.json`,
        year: GENERATED_YEAR,
        university: 'OTHER',
      },
      extractionQuality: 90,
      sourceFingerprint,
      rawText: candidate.questionText,
      sourceLocation: { span: `${candidate.topicKey}/family-${candidate.familyIndex + 1}` },
      validationIssues: ['generated-from-working-syllabus-blueprint', 'requires-editorial-review'],
      topicRefs: [],
      reviewStatus: 'draft',
    });
    normalizedExisting.add(normalized);
    existingGenerated.add(sourceFingerprint);
    existingGeneratedByFingerprint.set(sourceFingerprint, { _id: createdQuestion._id, questionText: candidate.questionText } as any);
    added += 1;
  }

  if (existingGenerated.size < TARGET_PER_SUBJECT) {
    throw new Error(`${blueprint.subject}: only generated ${existingGenerated.size}/${TARGET_PER_SUBJECT} unique syllabus questions`);
  }

  const total = await Question.countDocuments({ semester: 1, subject: blueprint.subject });
  await Paper.findByIdAndUpdate(paper._id, { totalQuestions: await Question.countDocuments({ paperId: paper._id }), questionsExtracted: true });
  await ContentGenerationService.generateFlashcards(blueprint.subject, 1, 1000);
  return { subject: blueprint.subject, added, total };
}

async function main(): Promise<void> {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/llb');
  try {
    for (const blueprint of semester1SyllabusBlueprint) {
      console.log(JSON.stringify(await generateSubject(blueprint)));
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
