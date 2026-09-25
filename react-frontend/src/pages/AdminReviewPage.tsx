import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';
import { ImportBatch } from '@/types';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

interface StagedQuestion { _id: string; questionNumber: string; questionText: string; marks: number; validationIssues: string[]; status: string; reviewNotes?: string; }

export function AdminReviewPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [selected, setSelected] = useState<ImportBatch | null>(null);
  const [questions, setQuestions] = useState<StagedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getImports();
      setBatches(response.data.batches || []);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setLoading(false); }
  };

  const loadQuestions = async (batch: ImportBatch) => {
    setSelected(batch);
    try {
      const response = await adminApi.getImportQuestions(batch._id);
      setQuestions(response.data.questions || []);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  };

  useEffect(() => { if (user?.role === 'admin') void loadBatches(); else setLoading(false); }, [user]);

  const review = async (question: StagedQuestion, status: 'accepted' | 'rejected' | 'needs_changes') => {
    if (!selected) return;
    try {
      const response = await adminApi.reviewImportQuestion(selected._id, question._id, { status });
      setQuestions((items) => items.map((item) => item._id === question._id ? response.data.question : item));
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  };

  const transition = async (action: 'approve' | 'promote') => {
    if (!selected) return;
    try {
      const response = action === 'approve' ? await adminApi.approveImport(selected._id) : await adminApi.promoteImport(selected._id);
      setSelected(response.data.batch);
      setBatches((items) => items.map((item) => item._id === selected._id ? response.data.batch : item));
      await loadQuestions(response.data.batch);
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  };

  if (!user || user.role !== 'admin') return <div className="rounded-lg bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Administrator access required</h1></div>;

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold">Content Review</h1><p className="mt-2 text-gray-600">Review quarantined imports before they become student-visible content.</p></div>{error && <ErrorMessage message={error} />}{loading ? <LoadingSpinner /> : <div className="grid gap-6 lg:grid-cols-[20rem_1fr]"><section className="rounded-lg bg-white p-4 shadow"><h2 className="font-semibold">Import batches</h2><div className="mt-3 space-y-2">{batches.map((batch) => <button key={batch._id} onClick={() => void loadQuestions(batch)} className={`block w-full rounded border p-3 text-left ${selected?._id === batch._id ? 'border-primary-600 bg-primary-50' : 'hover:bg-gray-50'}`}><p className="font-medium">{batch.sourceFileName}</p><p className="text-xs text-gray-500">{batch.status} · {batch.questionCount} questions</p></button>)}</div></section><section className="rounded-lg bg-white p-6 shadow">{selected ? <><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">{selected.metadata.title}</h2><p className="text-sm text-gray-500">{selected.sourceSha256} · {selected.status}</p></div><div className="flex gap-2">{selected.status === 'needs_review' && <button className="rounded bg-emerald-600 px-3 py-2 text-sm text-white" onClick={() => void transition('approve')}>Approve</button>}{selected.status === 'approved' && <button className="rounded bg-primary-700 px-3 py-2 text-sm text-white" onClick={() => void transition('promote')}>Promote</button>}</div></div><div className="mt-5 space-y-3">{questions.map((question) => <article key={question._id} className="rounded border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">Q{question.questionNumber} · {question.marks} marks</p><p className="mt-2 whitespace-pre-wrap">{question.questionText}</p>{question.validationIssues.length > 0 && <p className="mt-2 text-sm text-amber-700">Issues: {question.validationIssues.join(', ')}</p>}</div><span className="rounded bg-gray-100 px-2 py-1 text-xs">{question.status}</span></div>{['pending', 'needs_changes'].includes(question.status) && <div className="mt-3 flex gap-2"><button className="rounded bg-emerald-100 px-3 py-1 text-sm text-emerald-800" onClick={() => void review(question, 'accepted')}>Accept</button><button className="rounded bg-amber-100 px-3 py-1 text-sm text-amber-800" onClick={() => void review(question, 'needs_changes')}>Needs changes</button><button className="rounded bg-red-100 px-3 py-1 text-sm text-red-800" onClick={() => void review(question, 'rejected')}>Reject</button></div>}</article>)}</div></> : <p className="text-gray-500">Select an import batch to begin review.</p>}</section></div>}</div>;
}
