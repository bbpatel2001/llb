import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminSyllabusApi, adminWorkflowApi } from '@/lib/api';
import { Syllabus } from '@/types';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

const exampleSyllabus = {
  university: 'Goa University',
  semester: 1,
  subject: 'Criminal Law Paper - I',
  subjectCode: 'CC-102',
  credits: 4,
  description: 'Course description',
  objectives: ['Understand the core principles'],
  outcomes: ['Apply the principles to legal problems'],
  topics: [
    {
      id: 1,
      name: 'Introduction to Criminal Law',
      order: 1,
      description: 'Foundational concepts',
      subtopics: ['Nature and scope', 'Sources of criminal law'],
      estimatedHours: 5,
      keyTerms: ['Actus reus', 'Mens rea'],
      relatedSections: ['IPC Section 1'],
    },
  ],
  references: ['Primary statute or approved reference'],
  assessmentPattern: { endSemesterExam: 50, internalAssessment: 50, totalMarks: 100 },
  source: { format: 'json', fileName: 'syllabus.json' },
};

async function sha256Text(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function AdminSyllabusPage() {
  const { user } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [jsonText, setJsonText] = useState(JSON.stringify(exampleSyllabus, null, 2));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUniversity, setPdfUniversity] = useState('Goa University');
  const [pdfSubject, setPdfSubject] = useState('Criminal Law Paper - I');
  const [pdfSubjectCode, setPdfSubjectCode] = useState('CC-102');
  const [pdfSemester, setPdfSemester] = useState('1');
  const [pdfYear, setPdfYear] = useState(String(new Date().getFullYear()));
  const [pdfTitle, setPdfTitle] = useState('Criminal Law Paper - I');
  const [pdfCredits, setPdfCredits] = useState('4');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const loadSyllabi = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminSyllabusApi.getAll();
      setSyllabi(response.data.syllabi || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSyllabi(); }, [loadSyllabi]);

  if (!user || user.role !== 'admin') {
    return <div className="rounded-lg bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Administrator access required</h1></div>;
  }

  const createDraft = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const payload = JSON.parse(jsonText) as Record<string, unknown>;
      const source = (payload.source && typeof payload.source === 'object' ? payload.source : {}) as Record<string, unknown>;
      source.format = 'json';
      if (!source.fileName) source.fileName = `syllabus-${String(payload.subjectCode || 'draft')}.json`;
      if (!source.sha256) source.sha256 = await sha256Text(jsonText);
      payload.source = source;
      const response = await adminSyllabusApi.create(payload);
      setSyllabi((items) => [response.data.syllabus, ...items]);
      setMessage(`Draft version ${response.data.syllabus.version} created successfully.`);
    } catch (requestError) {
      setError(requestError instanceof SyntaxError ? 'The syllabus editor contains invalid JSON.' : getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const uploadPdf = async () => {
    try {
      setPdfUploading(true);
      setError(null);
      setMessage(null);
      if (!pdfFile) throw new Error('Choose a PDF syllabus before uploading.');
      if (pdfFile.size > 50 * 1024 * 1024) throw new Error('PDF uploads are limited to 50 MB.');
      const response = await adminSyllabusApi.uploadPdf(pdfFile, {
        university: pdfUniversity,
        subject: pdfSubject,
        subjectCode: pdfSubjectCode,
        semester: Number(pdfSemester),
        year: Number(pdfYear),
        title: pdfTitle,
        credits: pdfCredits ? Number(pdfCredits) : undefined,
      });
      const syllabus = response.data.syllabus as Syllabus;
      setSyllabi((items) => [syllabus, ...items]);
      setMessage(`PDF staged as draft version ${syllabus.version}. ${syllabus.topics.length} topics extracted across ${response.data.extraction.pageCount} pages. SHA-256: ${syllabus.source.sha256}`);
      setPdfFile(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPdfUploading(false);
    }
  };

  const approveDraft = async (syllabusId: string) => {
    try {
      setError(null);
      setMessage(null);
      await adminWorkflowApi.approveSyllabus(syllabusId);
      setApprovedIds((ids) => new Set(ids).add(syllabusId));
      setMessage('Syllabus approved. It can now be published.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const publishDraft = async (syllabusId: string) => {
    try {
      setError(null);
      setMessage(null);
      const response = await adminSyllabusApi.publish(syllabusId);
      setSyllabi((items) => items.map((item) => item.syllabusKey === response.data.syllabus.syllabusKey && item._id !== syllabusId && item.status === 'published' ? { ...item, status: 'archived' } : item._id === syllabusId ? response.data.syllabus : item));
      setMessage('Syllabus published. The previous published version, if any, was archived.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900">Syllabus Manager</h1><p className="mt-2 text-gray-600">Create versioned JSON drafts and publish them after administrative review.</p></div>
      {error && <ErrorMessage message={error} />}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}
      <section className="rounded-lg bg-white p-6 shadow"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Create JSON draft</h2><p className="mt-1 text-sm text-gray-500">The editor automatically adds a SHA-256 hash when the source does not provide one.</p></div><button disabled={saving} onClick={() => void createDraft()} className="rounded bg-primary-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Creating…' : 'Create draft'}</button></div><textarea value={jsonText} onChange={(event) => setJsonText(event.target.value)} spellCheck={false} className="mt-4 min-h-[30rem] w-full rounded border border-gray-300 bg-gray-950 p-4 font-mono text-sm text-green-200" aria-label="Syllabus JSON" /></section>
      <section className="rounded-lg bg-white p-6 shadow"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Stage PDF syllabus</h2><p className="mt-1 text-sm text-gray-500">PDFs are capped at 50 MB, parsed for topic headings, hashed for provenance, and held as drafts for review.</p></div><button disabled={pdfUploading || !pdfFile} onClick={() => void uploadPdf()} className="rounded bg-primary-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{pdfUploading ? 'Extracting…' : 'Upload PDF'}</button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-gray-700 md:col-span-2">PDF file<input type="file" accept="application/pdf" onChange={(event) => setPdfFile(event.target.files?.[0] || null)} className="mt-1 block w-full text-sm" /></label><label className="text-sm font-medium text-gray-700">University<input value={pdfUniversity} onChange={(event) => setPdfUniversity(event.target.value)} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm font-medium text-gray-700">Title<input value={pdfTitle} onChange={(event) => setPdfTitle(event.target.value)} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm font-medium text-gray-700">Subject<input value={pdfSubject} onChange={(event) => setPdfSubject(event.target.value)} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm font-medium text-gray-700">Subject code<input value={pdfSubjectCode} onChange={(event) => setPdfSubjectCode(event.target.value)} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm font-medium text-gray-700">Semester<input type="number" min="1" max="6" value={pdfSemester} onChange={(event) => setPdfSemester(event.target.value)} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm font-medium text-gray-700">Year<input type="number" min="1900" max="2200" value={pdfYear} onChange={(event) => setPdfYear(event.target.value)} className="mt-1 w-full rounded border p-2" /></label><label className="text-sm font-medium text-gray-700">Credits (optional)<input type="number" min="0" max="100" value={pdfCredits} onChange={(event) => setPdfCredits(event.target.value)} className="mt-1 w-full rounded border p-2" /></label></div></section>
      <section className="rounded-lg bg-white p-6 shadow"><h2 className="text-xl font-semibold">Syllabus versions</h2>{loading ? <div className="py-8"><LoadingSpinner /></div> : syllabi.length === 0 ? <p className="mt-4 text-gray-500">No syllabus drafts or published versions yet.</p> : <div className="mt-4 space-y-3">{syllabi.map((syllabus) => <div key={syllabus._id} className="flex flex-wrap items-center justify-between gap-4 rounded border p-4"><div><p className="font-semibold text-gray-900">{syllabus.subject} <span className="font-normal text-gray-500">({syllabus.subjectCode})</span></p><p className="mt-1 text-sm text-gray-600">{syllabus.university} · Semester {syllabus.semester} · Version {syllabus.version} · {syllabus.topics.length} normalized topics</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${syllabus.status === 'published' ? 'bg-green-100 text-green-800' : syllabus.status === 'archived' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800'}`}>{syllabus.status}</span>{syllabus.status === 'draft' && (approvedIds.has(syllabus._id) ? <button onClick={() => void publishDraft(syllabus._id)} className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white">Publish</button> : <button onClick={() => void approveDraft(syllabus._id)} className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white">Approve</button>)}</div></div>)}</div>}</section>
    </div>
  );
}
