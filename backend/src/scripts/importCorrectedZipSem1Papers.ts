import { execFileSync } from 'child_process';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Paper } from '../models/Paper';
import { Question } from '../models/Question';

dotenv.config();

type Spec = { file: string; code: string; subject: string; title: string; shortCode: string; year: number; examMonth: string };
type Pair = { number: string; marks: number; en: string; gu: string };

const zipPath = 'C:/Users/xeevi/Downloads/LLB_Sem1_CC101-107_Corrected.zip';
const specs: Spec[] = [
  { file: '2023_CS-101_Gujarat-University_Law-of-Tort-Including-Motor-Vehicle-Accident-and-Consumer-Protection-Laws.docx', code: 'DS-103', shortCode: 'CC-101', subject: 'CC-101 Law of Torts Including Motor Vehicle Accident and Consumer Protection Laws', title: 'CC-101 Law of Torts Including Motor Vehicle Accident and Consumer Protection Laws – December 2023 Gujarat University', year: 2023, examMonth: 'December' },
  { file: '2023_CS-102_Gujarat-University_Criminal-Law-–-I.docx', code: 'DT-103', shortCode: 'CC-102', subject: 'CC-102 Criminal Law I', title: 'CC-102 Criminal Law I – December 2023 Gujarat University', year: 2023, examMonth: 'December' },
  { file: '2023_CS-103_Gujarat-University_Criminal-Law-–-II.docx', code: 'DU-103', shortCode: 'CC-103', subject: 'CC-103 Criminal Law II', title: 'CC-103 Criminal Law II – December 2023 Gujarat University', year: 2023, examMonth: 'December' },
  { file: '2023_CS-104_Gujarat-University_Law-of-Contract.docx', code: 'DV-102', shortCode: 'CC-104', subject: 'CC-104 Law of Contract', title: 'CC-104 Law of Contract – December 2023 Gujarat University', year: 2023, examMonth: 'December' },
  { file: '2024_CS-105_Gujarat-University_Special-Contract.docx', code: 'JA-102', shortCode: 'CC-105', subject: 'CC-105 Special Contract', title: 'CC-105 Special Contract – January 2024 Gujarat University', year: 2024, examMonth: 'January' },
  { file: '2024_CS-106F_Gujarat-University_Constitutional-History-of-India.docx', code: 'JB-102', shortCode: 'CC-106F', subject: 'CC-106F Constitutional History of India', title: 'CC-106F Constitutional History of India – January 2024 Gujarat University', year: 2024, examMonth: 'January' },
  { file: '2024_CS-107K_Gujarat-University_Use-of-Law-Journal-and-Legal-Software.docx', code: 'JC-101', shortCode: 'CC-107K', subject: 'CC-107K Use of Law Journal and Legal Software', title: 'CC-107K Use of Law Journal and Legal Software – January 2024 Gujarat University', year: 2024, examMonth: 'January' },
];

function readParagraphs(file: string): string[] {
  const python = String.raw`
import io, json, re, sys, zipfile, xml.etree.ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
outer = zipfile.ZipFile(sys.argv[1])
inner = zipfile.ZipFile(io.BytesIO(outer.read(sys.argv[2])))
root = ET.fromstring(inner.read('word/document.xml'))
out = []
for p in root.findall('.//w:p', ns):
    text = ''.join(t.text or '' for t in p.iter('{%s}t' % ns['w']))
    text = re.sub(r'\s+', ' ', text).strip()
    if text: out.append(text)
print(json.dumps(out, ensure_ascii=False))
`;
  return JSON.parse(execFileSync('python', ['-c', python, zipPath, file], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
}

function isEnglishQuestion(line: string): boolean { return /\[.*(?:Marks|marks).*\]/.test(line); }
function isGujaratiQuestion(line: string): boolean { return /\[.*ગુણ.*\]/.test(line); }
function marksOf(line: string): number {
  const match = line.match(/\[(?:દરેક\s+)?(\d+(?:\.\d+)?|8⅓)\s*(?:Marks|marks|ગુણ)/);
  if (!match) return 25;
  return match[1] === '8⅓' ? 25 / 3 : Number(match[1]);
}

function questionNumber(line: string, seen: Map<string, number>): string {
  const clean = line.replace(/^(?:OLD COURSE|NEW COURSE)\s*[–-]\s*/i, '');
  const match = clean.match(/^(\d+)\s*(\((?:OR-?[AB]?|[AB])\))?/i);
  const base = match?.[1] || String(seen.size + 1);
  const explicit = match?.[2]?.toUpperCase();
  if (explicit?.includes('OR-A')) return `${base}(OR-A)`;
  if (explicit?.includes('OR-B')) return `${base}(OR-B)`;
  if (explicit?.includes('OR')) return `${base}(B)`;
  if (explicit) return `${base}${explicit}`;
  const count = (seen.get(base) || 0) + 1;
  seen.set(base, count);
  return `${base}${count === 1 ? '(A)' : '(B)'}`;
}

function cleanQuestion(line: string): string { return line.replace(/\s*\[[^\]]+\]\s*$/, '').trim(); }

function extractPairs(spec: Spec): Pair[] {
  const paragraphs = readParagraphs(spec.file);
  const english = paragraphs.filter(isEnglishQuestion);
  const gujarati = paragraphs.filter(isGujaratiQuestion);
  if (english.length !== gujarati.length) throw new Error(`${spec.file}: English/Gujarati mismatch ${english.length}/${gujarati.length}`);
  const seen = new Map<string, number>();
  return english.map((en, index) => ({ number: questionNumber(en, seen), marks: marksOf(en), en: cleanQuestion(en), gu: cleanQuestion(gujarati[index]) }));
}

async function main() {
  await connectDB();
  try {
    const imported: Array<{ code: string; paperId: string; questions: number }> = [];
    let added = 0;
    let updated = 0;
    for (const spec of specs) {
      const items = extractPairs(spec);
      const fileName = `GU_${spec.shortCode}_${spec.code}_${spec.examMonth}-${spec.year}.json`;
      const paper = await Paper.findOneAndUpdate(
        { fileName },
        { $set: { semester: 1, subject: spec.subject, title: spec.title, fileName, year: spec.year, examMonth: spec.examMonth, university: 'GU', totalQuestions: items.length, totalMarks: 100, questionsExtracted: true, status: 'COMPLETED', extractionNotes: `Exact English and Gujarati question pairs imported from corrected ZIP source ${spec.file}. Paper code: ${spec.code}. Source university: Gujarat University.`, sourcePath: `${zipPath}::${spec.file}`, reviewStatus: 'published', publishedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      for (const item of items) {
        const payload = { paperId: paper._id, semester: 1, subject: spec.subject, questionNumber: item.number, type: item.marks >= 20 ? 'LONG' : 'DESCRIPTIVE', marks: item.marks, questionText: item.en, questionTextGu: item.gu, difficulty: item.marks >= 20 ? 'HARD' : 'MEDIUM', tags: ['GU', 'Gujarat University', 'Semester 1', `${spec.examMonth} ${spec.year}`, spec.shortCode, spec.code, spec.subject], source: { fileName: spec.file, year: spec.year, university: 'GU' }, extractionQuality: 100, rawText: `${item.en}\n${item.gu}`, sourceLocation: { page: 1, span: `${spec.code} ${item.number}` }, validationIssues: [], topicRefs: [], reviewStatus: 'published', publishedAt: new Date() } as any;
        const existing = await Question.findOne({ paperId: paper._id, questionNumber: item.number });
        if (existing) { Object.assign(existing, payload); await existing.save(); updated += 1; } else { await Question.create(payload); added += 1; }
      }
      imported.push({ code: spec.code, paperId: String(paper._id), questions: items.length });
    }
    console.log(JSON.stringify({ imported, added, updated }, null, 2));
  } finally { await disconnectDB(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
