#!/usr/bin/env node
/**
 * Read-only source reconciliation report.
 *
 * This command never connects to MongoDB and never changes PDFs, JSON files,
 * or live question records. It inventories the source corpus and emits stable
 * fingerprints so a later staged import can be reviewed safely.
 */
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type JsonRecord = Record<string, unknown>;

interface PdfRecord {
  relativePath: string;
  fileName: string;
  semester?: number;
  subject?: string;
  sha256: string;
}

interface QuestionRecord {
  sourceFile: string;
  index: number;
  questionNumber: string | null;
  questionText: string | null;
  normalizedText: string | null;
  fingerprint: string | null;
  sourceKey: string | null;
  semester?: number;
  subject?: string;
  issues: string[];
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendDirectory = path.resolve(scriptDirectory, '../..');
const projectDirectory = path.resolve(backendDirectory, '..');
const papersDirectory = path.join(projectDirectory, 'papers');
const extractedDirectory = path.join(projectDirectory, 'extracted_questions');
const manifestPath = path.join(papersDirectory, 'PAPERS_MANIFEST.csv');

async function walk(directory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        files.push(...await walk(entryPath));
      } else {
        files.push(entryPath);
      }
    }

    return files;
  } catch {
    return [];
  }
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }

  values.push(value.trim());
  return values;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\uE000-\uF8FF\uFFFD]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function inferMetadata(fileName: string): { semester?: number; subject?: string } {
  const semesterMatch = fileName.match(/sem(?:ester)?[-_ ]?(\d+)/i);
  const subjectMatch = fileName.match(/^sem(?:ester)?[-_ ]?\d+[-_ ]+([a-z0-9-]+)/i);

  return {
    semester: semesterMatch ? Number(semesterMatch[1]) : undefined,
    subject: subjectMatch
      ? subjectMatch[1].replace(/[-_]+/g, ' ').trim().toUpperCase()
      : undefined,
  };
}

function getString(record: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function getNumber(record: JsonRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    const number = typeof value === 'number' ? value : Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function questionRecord(
  record: JsonRecord,
  sourceFile: string,
  index: number,
  metadata: { semester?: number; subject?: string },
): QuestionRecord {
  const questionNumber = getString(record, ['questionNumber', 'question_number', 'number']);
  const questionText = getString(record, ['questionText', 'question_text', 'question', 'text', 'prompt']);
  const normalizedText = questionText ? normalizeText(questionText) : null;
  const fingerprint = normalizedText ? sha256(normalizedText) : null;
  const marks = getNumber(record, ['marks', 'mark', 'maximumMarks']);
  const issues: string[] = [];

  if (!questionText) issues.push('missing-question-text');
  if (questionText && /[\uE000-\uF8FF\uFFFD]/.test(questionText)) issues.push('replacement-or-private-use-character');
  if (questionText && questionText.length < 12) issues.push('question-text-too-short');
  if (!questionNumber) issues.push('missing-question-number');
  if (marks !== null && (marks < 1 || marks > 50)) issues.push('marks-out-of-schema-range');
  if (questionText && /(?:www\.|https?:\/\/|instagram\.com)/i.test(questionText)) issues.push('metadata-or-url-in-question');

  const sourceKey = fingerprint
    ? `${sourceFile}:${questionNumber || 'unknown'}:${fingerprint}`
    : null;

  return {
    sourceFile,
    index,
    questionNumber,
    questionText,
    normalizedText,
    fingerprint,
    sourceKey,
    semester: metadata.semester,
    subject: metadata.subject,
    issues,
  };
}

async function readManifest(): Promise<{ rows: number; listedFileCount: number; subjects: Record<string, number> }> {
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    const headers = parseCsvLine(lines[0] || '');
    const fileCountIndex = headers.findIndex((header) => header.toLowerCase() === 'file count');
    const subjectIndex = headers.findIndex((header) => header.toLowerCase() === 'subject');
    const subjects: Record<string, number> = {};
    let listedFileCount = 0;

    for (const line of lines.slice(1)) {
      const fields = parseCsvLine(line);
      const count = Number(fields[fileCountIndex]);
      if (Number.isFinite(count)) listedFileCount += count;
      const subject = fields[subjectIndex] || 'UNKNOWN';
      subjects[subject] = (subjects[subject] || 0) + (Number.isFinite(count) ? count : 0);
    }

    return { rows: Math.max(lines.length - 1, 0), listedFileCount, subjects };
  } catch {
    return { rows: 0, listedFileCount: 0, subjects: {} };
  }
}

async function buildPdfReport(): Promise<{ files: PdfRecord[]; duplicateHashes: number }> {
  const pdfPaths = (await walk(papersDirectory)).filter((file) => file.toLowerCase().endsWith('.pdf'));
  const files: PdfRecord[] = [];

  for (const pdfPath of pdfPaths) {
    const relativePath = path.relative(projectDirectory, pdfPath).replace(/\\/g, '/');
    const metadata = inferMetadata(path.basename(pdfPath));
    const content = await fs.readFile(pdfPath);
    files.push({
      relativePath,
      fileName: path.basename(pdfPath),
      semester: metadata.semester,
      subject: metadata.subject,
      sha256: sha256(content),
    });
  }

  const hashCounts = new Map<string, number>();
  for (const file of files) hashCounts.set(file.sha256, (hashCounts.get(file.sha256) || 0) + 1);
  const duplicateHashes = [...hashCounts.values()].filter((count) => count > 1).length;

  return { files, duplicateHashes };
}

async function buildQuestionReport(): Promise<{
  files: string[];
  records: QuestionRecord[];
  malformedFiles: string[];
  duplicateFingerprints: number;
}> {
  const jsonPaths = (await walk(extractedDirectory))
    .filter((file) => file.toLowerCase().endsWith('.json'))
    .filter((file) => !/(backup|bak|report|summary)/i.test(path.basename(file)));
  const records: QuestionRecord[] = [];
  const malformedFiles: string[] = [];

  for (const jsonPath of jsonPaths) {
    const relativePath = path.relative(projectDirectory, jsonPath).replace(/\\/g, '/');
    const metadata = inferMetadata(path.basename(jsonPath));

    try {
      const parsed = JSON.parse(await fs.readFile(jsonPath, 'utf8')) as unknown;
      if (!Array.isArray(parsed)) {
        malformedFiles.push(relativePath);
        continue;
      }

      parsed.forEach((item, index) => {
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          records.push(questionRecord(item as JsonRecord, relativePath, index, metadata));
        } else {
          records.push({
            sourceFile: relativePath,
            index,
            questionNumber: null,
            questionText: null,
            normalizedText: null,
            fingerprint: null,
            sourceKey: null,
            semester: metadata.semester,
            subject: metadata.subject,
            issues: ['record-is-not-an-object'],
          });
        }
      });
    } catch {
      malformedFiles.push(relativePath);
    }
  }

  const fingerprints = new Map<string, number>();
  for (const record of records) {
    if (record.fingerprint) fingerprints.set(record.fingerprint, (fingerprints.get(record.fingerprint) || 0) + 1);
  }
  const duplicateFingerprints = [...fingerprints.values()].filter((count) => count > 1).length;

  return { files: jsonPaths.map((file) => path.relative(projectDirectory, file).replace(/\\/g, '/')), records, malformedFiles, duplicateFingerprints };
}

async function main() {
  const manifest = await readManifest();
  const pdfReport = await buildPdfReport();
  const questionReport = await buildQuestionReport();
  const issueCounts: Record<string, number> = {};

  for (const record of questionReport.records) {
    for (const issue of record.issues) issueCounts[issue] = (issueCounts[issue] || 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'read-only',
    sourceOfTruth: 'PDF files and PAPERS_MANIFEST.csv; extracted JSON is treated as a versioned artifact',
    manifest,
    pdfs: {
      count: pdfReport.files.length,
      duplicateContentHashGroups: pdfReport.duplicateHashes,
      files: pdfReport.files,
    },
    extractedQuestions: {
      files: questionReport.files,
      fileCount: questionReport.files.length,
      recordCount: questionReport.records.length,
      uniqueFingerprintCount: new Set(questionReport.records.map((record) => record.fingerprint).filter(Boolean)).size,
      duplicateFingerprintGroups: questionReport.duplicateFingerprints,
      malformedFiles: questionReport.malformedFiles,
      issueCounts,
      records: questionReport.records,
    },
    nextSafeStep: 'Review this report, quarantine ambiguous records, then import through a staged/upsert workflow. No live data was changed by this command.',
  };

  const outputArgumentIndex = process.argv.indexOf('--output');
  const outputArgument = outputArgumentIndex >= 0 ? process.argv[outputArgumentIndex + 1] : undefined;
  const serialized = JSON.stringify(report, null, 2);

  if (outputArgument) {
    const outputPath = path.resolve(process.cwd(), outputArgument);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, serialized, 'utf8');
    console.log(`Reconciliation report written to ${outputPath}`);
  } else {
    console.log(serialized);
  }
}

main().catch((error) => {
  console.error('Data reconciliation failed:', error);
  process.exitCode = 1;
});
