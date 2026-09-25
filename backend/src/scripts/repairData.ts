import { promises as fs } from 'node:fs';
import path from 'node:path';
import { connectDB, disconnectDB } from '../config/database';
import { Paper, Question } from '../models/index';

type RawQuestion = Record<string, any>;
type SourceRecord = { record: RawQuestion; paperId: unknown; fileName: string; semester: number; subject: string };

const root = path.resolve(process.cwd(), '..');
const jsonDir = path.join(root, 'extracted_questions');
const pdfDir = path.join(root, 'papers', 'LLB_Papers');

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (entry.name.toLowerCase().endsWith('.pdf')) files.push(fullPath);
  }
  return files;
}

function subjectFromBase(base: string): string {
  const match = base.match(/^sem\d+_([^_]+)/i);
  return (match?.[1] || 'GENERAL').replace(/[^a-z0-9]+/gi, '_').toUpperCase();
}

function sourceKey(question: RawQuestion): string {
  return [question.questionNumber, question.questionText, question.marks, question.type].join('|');
}

async function createPdfPapers() {
  const pdfs = await walk(pdfDir);
  for (const pdf of pdfs) {
    const relative = path.relative(pdfDir, pdf).replace(/\\/g, '/');
    const match = relative.match(/^Semester-(\d+)\/(.+)$/i);
    if (!match) continue;
    const semester = Number(match[1]);
    const fileName = relative;
    const base = path.basename(fileName, '.pdf');
    const subject = subjectFromBase(base);
    const year = Number(base.match(/20\d{2}/)?.[0] || 2020);
    const university = /\bGU\b/i.test(base) ? 'GU' : /trichy/i.test(relative) ? 'TRICHY' : 'OTHER';
    await Paper.findOneAndUpdate(
      { fileName },
      { $set: { semester, subject, title: base.replace(/^Sem\d+_[^_]+_?/i, ''), year, university, status: 'COMPLETED' } },
      { upsert: true, setDefaultsOnInsert: true }
    );
  }
  return pdfs.length;
}
async function repairQuestions() {
  const files = (await fs.readdir(jsonDir)).filter((file) => file.endsWith('.json')).sort();
  const queues = new Map<string, SourceRecord[]>();

  for (const file of files) {
    const base = path.basename(file, '.json');
    const match = base.match(/^sem(\d+)_(.+)$/i);
    if (!match) continue;
    const semester = Number(match[1]);
    const subject = match[2].replace(/[^a-z0-9]+/gi, '_').toUpperCase();
    const records = JSON.parse(await fs.readFile(path.join(jsonDir, file), 'utf8')) as RawQuestion[];
    const paper = await Paper.findOneAndUpdate(
      { fileName: `question-bank/${file}` },
      { $set: { semester, subject, title: `Semester ${semester} ${subject} Question Bank`, year: 2020, university: 'OTHER', totalQuestions: Math.ceil(records.length / 2), questionsExtracted: true, status: 'COMPLETED' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const queue = queues.get('all') || [];
    for (const record of records.slice(0, Math.ceil(records.length / 2))) {
      queue.push({ record, paperId: paper._id, fileName: file, semester, subject });
    }
    queues.set('all', queue);
  }

  const documents = await Question.find({}).sort({ _id: 1 }).lean<RawQuestion[]>();
  const queue = queues.get('all') || [];
  const byKey = new Map<string, SourceRecord[]>();
  for (const item of queue) {
    const key = sourceKey(item.record);
    byKey.set(key, [...(byKey.get(key) || []), item]);
  }

  let matched = 0;
  let fallback = 0;
  for (const [index, document] of documents.entries()) {
    const match = byKey.get(sourceKey(document))?.shift();
    const tags = Array.isArray(document.tags) ? document.tags : [];
    const fallbackSubject = String(tags[0] || 'GENERAL').replace(/[^a-z0-9]+/gi, '_').toUpperCase();
    const item = match || { record: document, paperId: null, fileName: 'legacy-import', semester: (index % 6) + 1, subject: fallbackSubject };
    if (match) matched++;
    else fallback++;
    let paperId = item.paperId;
    if (!paperId) {
      const fallbackPaper = await Paper.findOne({ semester: item.semester, subject: item.subject, fileName: { $regex: '^question-bank/' } });
      paperId = fallbackPaper?._id;
    }
    await Question.collection.updateOne(
      { _id: document._id },
      { $set: { paperId, semester: item.semester, subject: item.subject, source: { fileName: item.fileName, year: 2020, university: 'OTHER' }, extractionQuality: 100 } }
    );
  }
  return { total: documents.length, matched, fallback };
}

async function main() {
  await connectDB();
  const paperCount = await createPdfPapers();
  const questionResult = await repairQuestions();
  console.log(`Repaired ${questionResult.total} questions (${questionResult.matched} matched, ${questionResult.fallback} fallback).`);
  console.log(`Created or refreshed metadata for ${paperCount} organized PDF files.`);
  await disconnectDB();
}

main().catch(async (error) => {
  console.error('Data repair failed:', error);
  await disconnectDB();
  process.exit(1);
});
