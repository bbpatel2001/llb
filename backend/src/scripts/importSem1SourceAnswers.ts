import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { Answer } from '../models/Answer';
import { Question } from '../models/Question';

dotenv.config();

type Language = 'gu' | 'en';
type SubjectKey = 'criminal' | 'constitutional' | 'contract' | 'torts' | 'general';

interface SourceRecord {
  fileName: string;
  language: Language;
  text: string;
  subject: SubjectKey;
  questionNumber?: string;
  title: string;
  blocks: Array<{ type: 'heading' | 'paragraph'; text: string }>;
}

const answersDir = path.resolve(process.env.SEM1_ANSWERS_DIR || 'C:/projects/LLB/papers/GU/Sem-1/Answers');

const subjectPatterns: Record<SubjectKey, RegExp> = {
  criminal: /criminal|bns|ipc|defamation|kidnapping|abduction|rape|homicide|public peace|state against|crime/i,
  constitutional: /constitutional|cabinet mission|mountbatten|cripps|government of india|independence act|constitution|round table|simon|nehru/i,
  contract: /contract|specific relief|quasi|agency|bailment|indemnity|guarantee|consent|acceptance|partnership|unpaid seller|sale of goods/i,
  torts: /tort|consumer|doctor|hit.?and.?run|absolute liability|nuisance|assault|battery|vicarious/i,
  general: /law journal|legal software|legal reasoning|judgment|minority opinion|analytical|critical article/i,
};

const topicPatterns: Array<[RegExp, RegExp]> = [
  [/Cabinet_Mission_Mountbatten/i, /Cabinet Mission.*Mountbatten|Mountbatten Plan.*Cabinet Mission/i],
  [/Constitution_India_Final_Draft/i, /Final Draft.*adoption of the Constitution|adoption of the Constitution/i],
  [/Contract_Acceptance/i, /acceptance.*essential|essential.*acceptance|define acceptance/i],
  [/Contract_Agency/i, /What is agency|agency.*essential elements|termination of agency/i],
  [/Contract_Bailment/i, /Define.*Bailment|Bailment.*bailor|Bailment.*bailee/i],
  [/Contract_Consent|Contract_Free_Consent/i, /free consent|consent.*validity/i],
  [/Contract_Guarantee/i, /contract of guarantee.*essential|guarantee.*essential elements/i],
  [/Contract_Indemnity/i, /contract of indemnity.*essential|indemnity.*essential elements/i],
  [/Contract_Quasi/i, /quasi.?contract/i],
  [/Cripps_Mission/i, /Cripps Mission/i],
  [/Government_India_Act/i, /Government of India Act,? 1935/i],
  [/IPC_Culpable_Homicide/i, /culpable homicide|murder/i],
  [/IPC_Defamation/i, /defamation.*essential elements|offence of.*defamation/i],
  [/IPC_Kidnapping/i, /kidnapping|abduction/i],
  [/IPC_Rape/i, /offence of rape|rape/i],
  [/Indian_Independence/i, /Indian Independence Act,? 1947/i],
  [/Partnership_Non_Registration/i, /non.?registration of partnership/i],
  [/Sale_of_Goods/i, /unpaid seller|rights of unpaid seller/i],
  [/2017_Q3_Art_of_Reading|Judgment_Reading/i, /reading.*judg|judg.*reading|judgement|minority|dissent/i],
  [/2025_Legal_Reasoning/i, /legal reasoning/i],
  [/Part10_.*Specific_Relief/i, /specific relief/i],
  [/Part11_.*Indemnity/i, /indemnity/i],
  [/Part13_.*Continuing_Guarantee/i, /continuing guarantee|continue guarantee|rights of surety/i],
  [/Part14_.*Law_Journals/i, /importance of legal journal/i],
  [/Part15_.*Legal_Software/i, /legal software/i],
  [/Part16_.*Analytical_Critical/i, /analytical|critical.*article|legal articles/i],
  [/Part18_.*Hit_and_Run/i, /hit and run/i],
  [/Part19_.*Consumer_Forum/i, /consumer protection|liability of doctor/i],
  [/Part4_.*Defamation/i, /defamation/i],
  [/Part2_.*Criminal_Law2/i, /state against|offences against the state|offences against state/i],
  [/Part3_.*Criminal_Law2/i, /public peace|unlawful assembly|riot|affray/i],
  [/Part5_.*Simon_Nehru/i, /simon|nehru report/i],
  [/Part6_.*Round_Table/i, /round table/i],
  [/Part7_.*Cabinet_Mission/i, /cabinet mission/i],
  [/Part8_.*Essential_Elements/i, /essential elements.*valid contract|define contract/i],
  [/Part9_.*Quasi_Contract/i, /quasi.?contract/i],
];

function topicPatternFor(fileName: string): RegExp | undefined {
  return topicPatterns.find(([filePattern]) => filePattern.test(fileName))?.[1];
}

function preferredQuestionPatternFor(fileName: string): RegExp | undefined {
  if (/All_Torts_Are_Wrongs/i.test(fileName)) return /All Torts are wrongs/i;
  return undefined;
}

function subjectMatches(subjectKey: SubjectKey, question: any): boolean {
  const subject = String(question.subject || '').toLowerCase();
  return subject.includes(subjectKey) || subjectPatterns[subjectKey].test(question.subject || '') || subjectPatterns[subjectKey].test(question.questionText || '');
}

function cleanText(value: string): string {
  return value
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

function extractGujaratiQuestion(text: string): string | undefined {
  return text.split('\n')
    .map((line) => line.trim())
    .find((line) => /પ્રશ્ન|મૂળ પ્રશ્ન|પ્રશ્ન\s*[-–—]/i.test(line) && /[\u0A80-\u0AFF]/.test(line));
}

function cleanGujaratiAnswer(text: string): string {
  return text.split('\n\n')
    .map((block) => block.trim())
    .filter((block) => !(/^(Explain|Discuss|Define|State|Write|What|Describe)\b/i.test(block) && !/[\u0A80-\u0AFF]/.test(block)))
    .join('\n\n');
}

function blocksFor(text: string): Array<{ type: 'heading' | 'paragraph'; text: string }> {
  return text.split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => ({
      type: index === 0 || /^(?:\d+[.)]|[૧-૯]+[.)]|ભાગ|પ્રસ્તાવના|ઉપસંહાર|નિષ્કર્ષ|introduction|conclusion|references|question)/i.test(block)
        ? 'heading' as const
        : 'paragraph' as const,
      text: block,
    }));
}

function subjectFor(fileName: string, text: string): SubjectKey {
  const haystack = `${fileName} ${text.slice(0, 1800)}`;
  return (Object.keys(subjectPatterns) as SubjectKey[]).find((key) => subjectPatterns[key].test(haystack)) || 'general';
}

function questionNumberFor(fileName: string): string | undefined {
  const part = fileName.match(/Assignment_Part(\d+)/i);
  if (part) return part[1];
  const q = fileName.match(/Q(\d+)/i);
  return q?.[1];
}

function extractDocxFiles(): Array<{ fileName: string; paragraphs: string[] }> {
  const python = String.raw`
import glob, json, os, re, sys, zipfile, xml.etree.ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
out = []
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.docx'))):
    root = ET.fromstring(zipfile.ZipFile(f).read('word/document.xml'))
    paragraphs = []
    for p in root.findall('.//w:p', ns):
        s = ''.join(t.text or '' for t in p.iter('{%s}t' % ns['w']))
        s = re.sub(r'\s+', ' ', s).strip()
        if s: paragraphs.append(s)
    out.append({'fileName': os.path.basename(f), 'paragraphs': paragraphs})
print(json.dumps(out, ensure_ascii=False))
`;
  return JSON.parse(execFileSync('python', ['-c', python, answersDir], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }));
}

function splitBilingual(fileName: string, paragraphs: string[]): SourceRecord[] {
  const splitAt = paragraphs.findIndex((p, index) => index > 0 && (
    /^PART II\s*[—-]\s*ENGLISH ANSWER/i.test(p) ||
    /^\d{4}\s+QUESTION PAPER/i.test(p)
  ));
  const chunks = splitAt > 0 ? [paragraphs.slice(0, splitAt), paragraphs.slice(splitAt + 1)] : [paragraphs];
  const subject = subjectFor(fileName, paragraphs.join(' '));
  const q = questionNumberFor(fileName);
  return chunks.map((chunk, index) => ({
    fileName,
    language: splitAt > 0 && index === 1 ? 'en' : 'gu',
    text: cleanText(chunk.join('\n\n')),
    subject,
    questionNumber: q,
    title: chunk.find((p) => p.length > 20) || fileName,
    blocks: blocksFor(cleanText(chunk.join('\n\n'))),
  }));
}

function loadSourceRecords(): SourceRecord[] {
  const records: SourceRecord[] = [];
  for (const file of fs.readdirSync(answersDir).sort()) {
    const fullPath = path.join(answersDir, file);
    if (file.endsWith('.txt')) {
      const text = cleanText(fs.readFileSync(fullPath, 'utf8'));
      records.push({ fileName: file, language: 'en', text, subject: subjectFor(file, text), title: text.split('\n').find((line) => line.length > 10) || file, blocks: blocksFor(text) });
    }
  }
  for (const docx of extractDocxFiles()) records.push(...splitBilingual(docx.fileName, docx.paragraphs));
  return records;
}

function tokens(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter((t) => t.length > 3);
}

function scoreQuestion(record: SourceRecord, question: any): number {
  const sourceTokens = new Set(tokens(`${record.fileName} ${record.title} ${record.text.slice(0, 2500)}`));
  const questionTokens = new Set(tokens(question.questionText || ''));
  let score = 0;
  for (const token of sourceTokens) if (questionTokens.has(token)) score += 1;
  if (subjectPatterns[record.subject].test(question.subject || '')) score += 5;
  if (record.questionNumber && String(question.questionNumber) === record.questionNumber) score += 2;
  return score;
}

function normalizedQuestionText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function main(): Promise<void> {
  const records = loadSourceRecords();
  const dryRun = process.argv.includes('--dry-run');
  const includeAmbiguous = process.argv.includes('--include-ambiguous');
  await connectDB();
  try {
    try { await Answer.collection.dropIndex('text_text_keyPoints_text'); } catch { /* index may not exist */ }
    try { await Answer.collection.createIndex({ text: 'text', keyPoints: 'text' }, { language_override: 'languageCode' }); } catch { /* another process may have created it */ }
    const sourceNames = records.map((record) => record.fileName);
    if (!dryRun) await Answer.deleteMany({ generatedBy: 'manual', 'sources.0.title': { $in: sourceNames } });
    // Syllabus blueprint questions are study prompts, not paper questions. They
    // must not absorb a source answer merely because they share a topic word.
    const questions = (await Question.find({ semester: 1 }).lean())
      .filter((q) => !String(q.questionNumber || '').startsWith('SYL-'));
    let inserted = 0;
    let enhanced = 0;
    let skipped = 0;
    for (const record of records) {
      const topicPattern = topicPatternFor(record.fileName);
      const preferredPattern = preferredQuestionPatternFor(record.fileName);
      const topicCandidates = topicPattern
        ? questions.filter((q) => topicPattern.test(q.questionText || '') && subjectMatches(record.subject, q))
        : [];
      const preferredCandidates = preferredPattern
        ? questions.filter((q) => preferredPattern.test(q.questionText || '') && subjectMatches(record.subject, q))
        : [];
      const candidates = (preferredCandidates.length > 0 ? preferredCandidates : (topicCandidates.length > 0 ? topicCandidates : questions))
        .filter((q) => subjectMatches(record.subject, q))
        .map((q) => ({ q, score: scoreQuestion(record, q) }))
        .sort((a, b) => b.score - a.score);
      const best = candidates[0];
      const next = candidates[1];
      const sameQuestion = Boolean(best && next && normalizedQuestionText(best.q.questionText) === normalizedQuestionText(next.q.questionText));
      const minimumScore = 5;
      const ambiguous = !best || best.score < minimumScore || (next && best.score - next.score < 2 && !sameQuestion);
      if (ambiguous && !includeAmbiguous) {
        console.warn(`AMBIGUOUS: ${record.fileName} [${record.language}] best=${best?.score ?? 0} next=${next?.score ?? 0}`);
        skipped += 1;
        continue;
      }
      const targetPool = preferredCandidates.length
        ? preferredCandidates.map((q) => ({ q, score: scoreQuestion(record, q) }))
        : topicCandidates.length
          ? topicCandidates.map((q) => ({ q, score: scoreQuestion(record, q) }))
          : candidates;
      const targets = ambiguous
        ? targetPool.filter((candidate) => best && candidate.score >= best.score - 1).slice(0, 10)
        : candidates.filter((candidate) => candidate.score === best.score || normalizedQuestionText(candidate.q.questionText) === normalizedQuestionText(best.q.questionText));
      if (targets.length === 0) {
        console.warn(`AMBIGUOUS: ${record.fileName} [${record.language}] no usable candidate`);
        skipped += 1;
        continue;
      }
      for (const target of targets) {
        const key = { questionId: target.q._id, type: 'long', language: record.language };
        const answerText = record.language === 'gu' ? cleanGujaratiAnswer(record.text) : record.text;
        const payload = {
        paperId: target.q.paperId,
        text: answerText,
        formattedContent: record.blocks,
        wordCount: answerText.split(/\s+/).filter(Boolean).length,
        keyPoints: [record.title],
        studyTips: ['Use the section headings as an examination answer outline.', 'State the governing legal provision and connect it to the examples.', 'End with a conclusion that answers the exact question.'],
        difficulty: 'medium' as const,
        generatedBy: 'manual' as const,
        qualityScore: 9,
        verified: !ambiguous,
        reviewStatus: ambiguous ? 'review_required' as const : 'approved' as const,
        sources: [{ type: 'article' as const, title: record.fileName }],
        };
        if (record.language === 'gu') {
          const questionTextGu = extractGujaratiQuestion(answerText);
          if (questionTextGu) await Question.updateOne({ _id: target.q._id }, { $set: { questionTextGu, ...(ambiguous ? { reviewStatus: 'review_required' } : {}) } });
        } else if (ambiguous) {
          await Question.updateOne({ _id: target.q._id }, { $set: { reviewStatus: 'review_required' } });
        }
        const existing = await Answer.findOne(key).select('_id').lean();
        if (!dryRun) await Answer.updateOne(key, { $set: payload }, { upsert: true });
        if (existing) enhanced += 1; else inserted += 1;
        console.log(`${dryRun ? 'MATCH' : (existing ? 'ENHANCED' : 'INSERTED')} ${ambiguous ? '[Review Required] ' : ''}${record.fileName} [${record.language}] -> ${target.q._id} score=${target.score}`);
      }
    }
    console.log(`DONE inserted=${inserted} enhanced=${enhanced} skipped=${skipped}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Semester 1 source answer import failed:', error);
  process.exitCode = 1;
});
