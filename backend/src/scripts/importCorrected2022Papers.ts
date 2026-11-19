import { execFileSync } from 'child_process';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Paper } from '../models/Paper';
import { Question } from '../models/Question';

dotenv.config();

type Spec = { file: string; code: string; subject: string; title: string; shortCode: string; month: string; maxMarks: number };
type Item = { number: string; marks: number; en: string; gu: string };

const zipPath = 'C:/Users/xeevi/Downloads/GU_LLB_2022_14_Corrected_Papers.zip';
const subjects: Record<string, { subject: string; shortCode: string }> = {
  '101': { subject: '101 Law of Torts Including Motor Vehicle Accident and Consumer Protection Laws', shortCode: 'CC-101' },
  '104': { subject: '104 Law of Contract and Specific Relief Act', shortCode: 'CC-104' },
  '105': { subject: '105 Special Contract', shortCode: 'CC-105' },
  '106F': { subject: '106F Constitutional History of India', shortCode: 'CC-106F' },
  '107K': { subject: '107K Use of Law Journals and Legal Software', shortCode: 'CC-107K' },
  'CC102': { subject: 'CC-102 Criminal Law I', shortCode: 'CC-102' },
  'CC103': { subject: 'CC-103 Criminal Law II', shortCode: 'CC-103' },
};

const specs: Spec[] = [];
for (const [key, subject] of Object.entries(subjects)) {
  const dec = key === '106F' ? 'Dec-106F-Constitutional-History_Bilingual.docx' : key === '107K' ? 'Dec-107K-Law-Journals_Bilingual.docx' : key.startsWith('CC') ? `Dec-${key}-Criminal-Law-${key === 'CC102' ? 'I' : 'II'}_Bilingual.docx` : `Dec-${key}-${key === '101' ? 'Law-of-Tort' : key === '104' ? 'Law-of-Contract' : 'Special-Contract'}_Bilingual.docx`;
  const mar = key === '106F' ? 'Mar-F106-Constitutional-History_Bilingual.docx' : key === '107K' ? 'Mar-K107-Law-Journals_Bilingual.docx' : key === '105' ? 'Mar-CC105-Special-Contract_Bilingual.docx' : key.startsWith('CC') ? `Mar-${key}-Criminal-Law-${key === 'CC102' ? 'I' : 'II'}_Bilingual.docx` : `Mar-${key}-${key === '101' ? 'Law-of-Tort' : 'Law-of-Contract'}_Bilingual.docx`;
  specs.push({ file: dec, code: key === '106F' ? '106-F' : key === '107K' ? '107-K' : key.startsWith('CC') ? key.replace('CC', 'CC-') : key, subject: subject.subject, shortCode: subject.shortCode, month: 'December', maxMarks: 100, title: `${subject.subject} – December 2022 Gujarat University` });
  specs.push({ file: mar, code: key === '106F' ? 'F-106' : key === '107K' ? 'K-107' : key.startsWith('CC') ? key.replace('CC', 'CC-') : key, subject: subject.subject, shortCode: subject.shortCode, month: 'March', maxMarks: 60, title: `${subject.subject} – March 2022 Gujarat University` });
}

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

function marksFromHeading(line: string): number | undefined {
  const match = line.match(/\((\d+(?:\.\d+)?|8⅓)\s*marks?\)/i);
  if (!match) return undefined;
  return match[1] === '8⅓' ? 25 / 3 : Number(match[1]);
}

function questionNumber(line: string, seen: Map<string, number>): string {
  const match = line.match(/^Question\s+(\d+)\s*(?:–\s*)?(?:OR\s*)?(?:\((A|B)\))?/i);
  if (!match) return `Q${seen.size + 1}`;
  const base = match[1];
  if (base === '4') {
    const option = line.match(/Option\s+(\d+)/i);
    if (option) return `4(${option[1]})`;
    if (/Any\s+(?:One|Two|Three)/i.test(line)) return '4(1)';
  }
  const explicit = match[2]?.toUpperCase();
  if (/OR\s*\(A\)/i.test(line)) return `${base}(OR-A)`;
  if (/OR\s*\(B\)/i.test(line)) return `${base}(OR-B)`;
  if (explicit) return `${base}(${explicit})`;
  if (/OR/i.test(line)) return `${base}(B)`;
  const count = (seen.get(base) || 0) + 1;
  seen.set(base, count);
  return `${base}${count === 1 ? '(A)' : '(B)'}`;
}

function cleanQuestion(line: string): string { return line.replace(/^English:\s*|^ગુજરાતી:\s*/i, '').trim(); }

function extractItems(spec: Spec): Item[] {
  const paragraphs = readParagraphs(spec.file);
  const items: Item[] = [];
  const seen = new Map<string, number>();
  let currentMarks = 25;
  let currentNumber = '';
  for (let i = 0; i < paragraphs.length; i += 1) {
    const line = paragraphs[i];
    if (/^Question\s+/i.test(line)) {
      currentNumber = questionNumber(line, seen);
      currentMarks = marksFromHeading(line) ?? currentMarks;
    }
    if (!/^English:\s*/i.test(line)) continue;
    const gu = paragraphs[i + 1];
    if (!gu || !/^ગુજરાતી:\s*/.test(gu)) continue;
    items.push({ number: currentNumber || `Q${items.length + 1}`, marks: currentMarks, en: cleanQuestion(line), gu: cleanQuestion(gu) });
  }
  if (!items.length) throw new Error(`${spec.file}: no bilingual question pairs found`);
  return items;
}

async function main() {
  await connectDB();
  try {
    const imported: Array<{ code: string; month: string; paperId: string; questions: number }> = [];
    let added = 0;
    let updated = 0;
    for (const spec of specs) {
      const items = extractItems(spec);
      const fileName = `GU_${spec.shortCode}_${spec.code}_${spec.month}-2022.json`;
      const paper = await Paper.findOneAndUpdate(
        { fileName },
        { $set: { semester: 1, subject: spec.subject, title: spec.title, fileName, year: 2022, examMonth: spec.month, university: 'GU', totalQuestions: items.length, totalMarks: spec.maxMarks, questionsExtracted: true, status: 'COMPLETED', extractionNotes: `Exact English and Gujarati question pairs imported from corrected ZIP source ${spec.file}. Paper code: ${spec.code}. Source university: Gujarat University.`, sourcePath: `${zipPath}::${spec.file}`, reviewStatus: 'published', publishedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      for (const item of items) {
        const payload = { paperId: paper._id, semester: 1, subject: spec.subject, questionNumber: item.number, type: item.marks >= 20 ? 'LONG' : 'DESCRIPTIVE', marks: item.marks, questionText: item.en, questionTextGu: item.gu, difficulty: item.marks >= 20 ? 'HARD' : 'MEDIUM', tags: ['GU', 'Gujarat University', 'Semester 1', `${spec.month} 2022`, spec.shortCode, spec.code, spec.subject], source: { fileName: spec.file, year: 2022, university: 'GU' }, extractionQuality: 100, rawText: `${item.en}\n${item.gu}`, sourceLocation: { page: 1, span: `${spec.code} ${item.number}` }, validationIssues: [], topicRefs: [], reviewStatus: 'published', publishedAt: new Date() } as any;
        const existing = await Question.findOne({ paperId: paper._id, questionNumber: item.number });
        if (existing) { Object.assign(existing, payload); await existing.save(); updated += 1; } else { await Question.create(payload); added += 1; }
      }
      imported.push({ code: spec.code, month: spec.month, paperId: String(paper._id), questions: items.length });
    }
    console.log(JSON.stringify({ imported, added, updated }, null, 2));
  } finally { await disconnectDB(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
