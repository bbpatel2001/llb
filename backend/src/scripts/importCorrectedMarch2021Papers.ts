import { execFileSync } from 'child_process';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/database';
import { Paper } from '../models/Paper';
import { Question } from '../models/Question';

dotenv.config();

type Spec = { file: string; code: string; subject: string; title: string; shortCode: string };
type Item = { number: string; marks: number; en: string; gu: string };

const zipPath = 'C:/Users/xeevi/Downloads/GU_LLB_March_2021_Seven_Papers_Rebuilt.zip';
const specs: Spec[] = [
  { file: 'March-2021-101-Law-of-Tort-Bilingual.docx', code: 'MA-101', shortCode: 'CC-101', subject: '101 Law of Torts Including Motor Vehicle Accident and Consumer Protection Laws', title: '101 Law of Torts – March 2021 Gujarat University' },
  { file: 'March-2021-102-Criminal-Law-I-Bilingual.docx', code: 'MB-101', shortCode: 'CC-102', subject: '102 Criminal Law I', title: '102 Criminal Law I – March 2021 Gujarat University' },
  { file: 'March-2021-103-Criminal-Law-II-Bilingual.docx', code: 'MC-101', shortCode: 'CC-103', subject: '103 Criminal Law II', title: '103 Criminal Law II – March 2021 Gujarat University' },
  { file: 'March-2021-104-Contract-Bilingual.docx', code: 'MD-101', shortCode: 'CC-104', subject: '104 Law of Contract and Specific Relief Act', title: '104 Law of Contract and Specific Relief Act – March 2021 Gujarat University' },
  { file: 'March-2021-105-Special-Contract-Bilingual.docx', code: 'ME-101', shortCode: 'CC-105', subject: '105 Special Contract', title: '105 Special Contract – March 2021 Gujarat University' },
  { file: 'March-2021-106F-Constitutional-History-Bilingual.docx', code: 'MF-101', shortCode: 'CC-106F', subject: '106F Constitutional History of India', title: '106F Constitutional History of India – March 2021 Gujarat University' },
  { file: 'March-2021-107K-Law-Journals-Bilingual.docx', code: 'MG-101', shortCode: 'CC-107K', subject: '107K Use of Law Journals and Legal Software', title: '107K Use of Law Journals and Legal Software – March 2021 Gujarat University' },
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

function numberFromEnglish(line: string): string | undefined {
  const match = line.match(/^(?:Question\s+)?(\d+)\s*[.)]/i);
  return match?.[1];
}

function marksFromHeading(line: string): number {
  const match = line.match(/\[(\d+(?:\.\d+)?)\s*marks?\]/i);
  return match ? Number(match[1]) : 20;
}

function clean(line: string): string {
  return line.replace(/^English:\s*|^ગુજરાતી:\s*/i, '').trim();
}

function extractItems(spec: Spec): Item[] {
  const paragraphs = readParagraphs(spec.file);
  const english = new Map<string, { text: string; marks: number }>();
  const gujarati = new Map<string, string>();
  for (const line of paragraphs) {
    const number = numberFromEnglish(line);
    if (!number) continue;
    if (/[\u0A80-\u0AFF]/.test(line)) gujarati.set(number, clean(line));
    else english.set(number, { text: clean(line), marks: marksFromHeading(line) });
  }
  const items: Item[] = [...english.keys()].map((number) => ({ number, marks: english.get(number)!.marks, en: english.get(number)!.text, gu: gujarati.get(number) || '' }));
  if (items.some((item) => !item.gu)) throw new Error(`${spec.file}: one or more Gujarati questions could not be paired`);
  if (items.length !== 6) throw new Error(`${spec.file}: expected 6 bilingual questions, found ${items.length}`);
  return items;
}

async function main() {
  await connectDB();
  try {
    const imported: Array<{ code: string; paperId: string; questions: number }> = [];
    let added = 0;
    let updated = 0;
    for (const spec of specs) {
      const items = extractItems(spec);
      const fileName = `GU_${spec.shortCode}_${spec.code}_March-2021.json`;
      const paper = await Paper.findOneAndUpdate(
        { fileName },
        { $set: { semester: 1, subject: spec.subject, title: spec.title, fileName, year: 2021, examMonth: 'March', university: 'GU', totalQuestions: items.length, totalMarks: 60, questionsExtracted: true, status: 'COMPLETED', extractionNotes: `Exact English and Gujarati question pairs imported from corrected ZIP source ${spec.file}. Paper code: ${spec.code}. Source university: Gujarat University.`, sourcePath: `${zipPath}::${spec.file}`, reviewStatus: 'published', publishedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      for (const item of items) {
        const payload = { paperId: paper._id, semester: 1, subject: spec.subject, questionNumber: item.number, type: 'LONG' as const, marks: item.marks, questionText: item.en, questionTextGu: item.gu, difficulty: 'HARD' as const, tags: ['GU', 'Gujarat University', 'Semester 1', 'March 2021', spec.shortCode, spec.code, spec.subject], source: { fileName: spec.file, year: 2021, university: 'GU' }, extractionQuality: 100, rawText: `${item.en}\n${item.gu}`, sourceLocation: { page: 1, span: `${spec.code} ${item.number}` }, validationIssues: [], topicRefs: [], reviewStatus: 'published' as const, publishedAt: new Date() } as any;
        const existing = await Question.findOne({ paperId: paper._id, questionNumber: item.number });
        if (existing) { Object.assign(existing, payload); await existing.save(); updated += 1; } else { await Question.create(payload); added += 1; }
      }
      imported.push({ code: spec.code, paperId: String(paper._id), questions: items.length });
    }
    console.log(JSON.stringify({ imported, added, updated }, null, 2));
  } finally { await disconnectDB(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
