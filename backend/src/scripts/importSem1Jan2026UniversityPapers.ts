import path from 'path';
import { execFileSync } from 'child_process';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Paper } from '../models/Paper';
import { Question } from '../models/Question';

dotenv.config();

type PaperSpec = {
  file: string;
  code: string;
  subject: string;
  title: string;
  shortCode: string;
};

type Extracted = { paragraphs: string[] };
type Item = { questionNumber: string; marks: number; en: string; gu: string };

const sourceDir = 'C:/projects/LLB/papers/GU/Sem-1/2025';
const specs: PaperSpec[] = [
  { file: '2026_CS-102_Gujarat-University_Criminal-Law-Paper-I-General-Principles-of-Penal-Law.docx', code: 'JR-136', shortCode: 'CS-102', subject: '102 Criminal Law Paper I General Principles of Penal Law', title: '102 Criminal Law Paper I General Principles of Penal Law – January 2026 Gujarat University' },
  { file: '2026_CS-103_Gujarat-University_Criminal-Law.docx', code: 'JS-116', shortCode: 'CC-103', subject: 'CC-103 Criminal Law', title: 'CC-103 Criminal Law – January 2026 Gujarat University' },
  { file: '2026_CS-104_Gujarat-University_Law-of-Contract-and-Specific-Relief-Act-I.docx', code: 'JT-126', shortCode: '104', subject: '104 Law of Contract and Specific Relief Act I', title: '104 Law of Contract and Specific Relief Act I – January 2026 Gujarat University' },
  { file: '2026_CS-105_Gujarat-University_Special-Contract.docx', code: 'JU-110', shortCode: 'CC-105', subject: 'CC-105 Special Contract', title: 'CC-105 Special Contract – January 2026 Gujarat University' },
  { file: '2026_CS-106F_Gujarat-University_Constitutional-History-of-India.docx', code: 'JV-112', shortCode: '106F', subject: 'Foundation-106F Constitutional History of India', title: 'Foundation-106F Constitutional History of India – January 2026 Gujarat University' },
  { file: '2026_CS-107K_Gujarat-University_Law-Use-of-Law-Journal-and-Legal-Software.docx', code: 'JW-109', shortCode: '107K', subject: '107K Law Use of Law Journal and Legal Software', title: '107K Law Use of Law Journal and Legal Software – January 2026 Gujarat University' },
];

function readDocx(file: string): Extracted {
  const python = String.raw`
import json, re, sys, zipfile, xml.etree.ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
root = ET.fromstring(zipfile.ZipFile(sys.argv[1]).read('word/document.xml'))
paragraphs = []
for p in root.findall('.//w:p', ns):
    text = ''.join(t.text or '' for t in p.iter('{%s}t' % ns['w']))
    text = re.sub(r'\s+', ' ', text).strip()
    if text: paragraphs.append(text)
print(json.dumps({'paragraphs': paragraphs}, ensure_ascii=False))
`;
  return JSON.parse(execFileSync('python', ['-c', python, path.join(sourceDir, file)], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }));
}

function noteMarks(spec: PaperSpec, number: string): number {
  if (/^[1-3]\(/.test(number)) return 25;
  if (spec.code === 'JR-136') return 12.5;
  if (spec.code === 'JS-116') return 25 / 3;
  if (spec.code === 'JT-126') return 12.5;
  if (spec.code === 'JU-110') return number.startsWith('4(A)') ? 7.5 : 10;
  if (spec.code === 'JV-112') return 25;
  if (spec.code === 'JW-109') return number.startsWith('4(A)') ? 15 : 2;
  return 25;
}

function parseItems(spec: PaperSpec): Item[] {
  const paragraphs = readDocx(spec.file).paragraphs;
  const items: Item[] = [];
  let heading = '';
  let headingSeen = 0;
  let groupedHeading = false;
  for (let i = 0; i < paragraphs.length; i += 1) {
    const line = paragraphs[i];
    const headingMatch = line.match(/^Question\s+([0-9]+(?:\([A-Za-z0-9]+\))?)/i);
    if (headingMatch) {
      const rawHeading = headingMatch[1].toUpperCase();
      heading = /\bOR\b/i.test(line) && /^\d+$/.test(rawHeading) ? `${rawHeading}(B)` : rawHeading;
      groupedHeading = /^4\([AB]\)$/i.test(heading) && /(Explain any Two|any One|State with reasons)/i.test(line);
      headingSeen = 0;
    }
    if (!/^English:\s*/i.test(line)) continue;
    const en = line.replace(/^English:\s*/i, '').trim();
    const guLine = paragraphs[i + 1];
    if (!guLine || !/^ગુજરાતી:\s*/.test(guLine)) continue;
    const gu = guLine.replace(/^ગુજરાતી:\s*/, '').trim();
    headingSeen += 1;
    let number = heading;
    if (/^4\([AB]\)$/i.test(heading) && groupedHeading) number = `${heading}(${headingSeen})`;
    else if (/^\d+$/i.test(heading)) number = `${headingSeen === 1 ? `${heading}(A)` : `${heading}(B)`}`;
    const marks = noteMarks(spec, number);
    items.push({ questionNumber: number, marks, en, gu });
  }
  return items;
}

async function main() {
  await connectDB();
  try {
    let totalAdded = 0;
    let totalUpdated = 0;
    const imported: Array<{ code: string; paperId: string; questions: number }> = [];
    for (const spec of specs) {
      const fileName = `GU_${spec.shortCode}_${spec.code}_January-2026.json`;
      const items = parseItems(spec);
      const paper = await Paper.findOneAndUpdate(
        { fileName },
        { $set: { semester: 1, subject: spec.subject, title: spec.title, fileName, year: 2026, examMonth: 'January', university: 'GU', totalQuestions: items.length, totalMarks: 100, questionsExtracted: true, status: 'COMPLETED', extractionNotes: `Exact English and Gujarati question pairs imported from ${spec.file}. Question-paper code: ${spec.code}. Source university: Gujarat University.`, sourcePath: path.join(sourceDir, spec.file), reviewStatus: 'published', publishedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      let added = 0;
      let updated = 0;
      for (const item of items) {
        const source = { fileName: spec.file, year: 2026, university: 'GU' };
        const payload = { paperId: paper._id, semester: 1, subject: spec.subject, questionNumber: item.questionNumber, type: item.marks >= 20 ? 'LONG' : 'DESCRIPTIVE', marks: item.marks, questionText: item.en, questionTextGu: item.gu, difficulty: item.marks >= 20 ? 'HARD' : 'MEDIUM', tags: ['GU', 'Gujarat University', 'Semester 1', 'January 2026', spec.shortCode, spec.code, spec.subject], source, extractionQuality: 100, rawText: `${item.en}\n${item.gu}`, sourceLocation: { page: 1, span: `${spec.code} ${item.questionNumber}` }, validationIssues: [], topicRefs: [], reviewStatus: 'published', publishedAt: new Date() } as any;
        const existing = await Question.findOne({ paperId: paper._id, questionNumber: item.questionNumber });
        if (existing) { Object.assign(existing, payload); await existing.save(); updated += 1; } else { await Question.create(payload); added += 1; }
      }
      totalAdded += added;
      totalUpdated += updated;
      imported.push({ code: spec.code, paperId: String(paper._id), questions: items.length });
    }
    console.log(JSON.stringify({ imported, totalAdded, totalUpdated }, null, 2));
  } finally { await disconnectDB(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
