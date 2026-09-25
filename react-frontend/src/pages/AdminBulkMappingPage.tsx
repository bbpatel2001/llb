import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminWorkflowApi, syllabiApi } from '@/lib/api';
import { Syllabus, SyllabusTopic } from '@/types';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

export function AdminBulkMappingPage() {
  const { user } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [syllabusId, setSyllabusId] = useState('');
  const [topicKey, setTopicKey] = useState('');
  const [questionIds, setQuestionIds] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { setLoading(false); return; }
    syllabiApi.getAll({ limit: 100 })
      .then((response) => { const loaded = response.data.syllabi || []; setSyllabi(loaded); if (loaded[0]) setSyllabusId(loaded[0]._id); })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!syllabusId) return;
    setTopicKey('');
    syllabiApi.getTopics(syllabusId)
      .then((response) => setTopics(response.data.topics || []))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [syllabusId]);

  if (!user || user.role !== 'admin') return <div className="rounded-lg bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Administrator access required</h1></div>;

  const selectedSyllabus = syllabi.find((syllabus) => syllabus._id === syllabusId);
  const save = async () => {
    const ids = [...new Set(questionIds.split(/[\s,]+/).map((id) => id.trim()).filter(Boolean))];
    if (!selectedSyllabus || !topicKey || ids.length === 0) { setError('Select a syllabus/topic and enter at least one question ID.'); return; }
    try {
      setSaving(true); setError(null); setMessage(null);
      const mappings = ids.map((questionId) => ({ questionId, mappings: [{ syllabusId: selectedSyllabus._id, syllabusVersion: selectedSyllabus.version, topicKey }] }));
      const response = await adminWorkflowApi.bulkMapQuestionTopics(mappings);
      setMessage(`${response.data.mappedQuestions} question mappings submitted successfully.`);
      setQuestionIds('');
    } catch (requestError) { setError(getErrorMessage(requestError)); }
    finally { setSaving(false); }
  };

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-gray-900">Bulk Topic Mapping</h1><p className="mt-2 text-gray-600">Apply one published syllabus topic to multiple question IDs. Existing mappings on those questions are replaced.</p></div>{error && <ErrorMessage message={error} />}{message && <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message}</div>}{loading ? <LoadingSpinner /> : <section className="max-w-3xl rounded-lg bg-white p-6 shadow"><div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-gray-700">Published syllabus<select value={syllabusId} onChange={(event) => setSyllabusId(event.target.value)} className="mt-1 block w-full rounded border p-2"><option value="">Select syllabus</option>{syllabi.map((syllabus) => <option key={syllabus._id} value={syllabus._id}>{syllabus.subjectCode} · v{syllabus.version}</option>)}</select></label><label className="text-sm font-medium text-gray-700">Topic<select value={topicKey} onChange={(event) => setTopicKey(event.target.value)} className="mt-1 block w-full rounded border p-2"><option value="">Select topic</option>{topics.map((topic) => <option key={topic.topicKey} value={topic.topicKey}>{topic.parentTopicKey ? '↳ ' : ''}{topic.name}</option>)}</select></label></div><label className="mt-5 block text-sm font-medium text-gray-700">Question IDs<textarea value={questionIds} onChange={(event) => setQuestionIds(event.target.value)} placeholder="One MongoDB question ID per line" className="mt-1 min-h-40 w-full rounded border p-3 font-mono text-sm" /></label><button disabled={saving} onClick={() => void save()} className="mt-4 rounded bg-primary-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Mapping…' : 'Map questions'}</button></section>}</div>;
}
