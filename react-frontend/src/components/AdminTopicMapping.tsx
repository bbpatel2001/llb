import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminSyllabusApi, syllabiApi } from '@/lib/api';
import { Question, Syllabus, SyllabusTopic } from '@/types';
import { getErrorMessage } from '@/lib/utils';

export function AdminTopicMapping({ question, onSaved }: { question: Question; onSaved?: (topicRefs: Question['topicRefs']) => void }) {
  const { user } = useAuth();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [syllabusId, setSyllabusId] = useState(question.topicRefs?.[0]?.syllabusId || '');
  const [topicKey, setTopicKey] = useState(question.topicRefs?.[0]?.topicKey || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSyllabi = useCallback(async () => {
    try {
      const response = await syllabiApi.getAll({ limit: 100 });
      const loaded = response.data.syllabi || [];
      setSyllabi(loaded);
      if (!syllabusId && loaded[0]) setSyllabusId(loaded[0]._id);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [syllabusId]);

  useEffect(() => { if (user?.role === 'admin') void loadSyllabi(); else setLoading(false); }, [loadSyllabi, user]);

  useEffect(() => {
    if (!syllabusId) return;
    syllabiApi.getTopics(syllabusId)
      .then((response) => setTopics(response.data.topics || []))
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [syllabusId]);

  if (!user || user.role !== 'admin') return null;

  const saveMapping = async () => {
    const syllabus = syllabi.find((item) => item._id === syllabusId);
    if (!syllabus || !topicKey) {
      setError('Select a published syllabus and topic before saving.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const mappings = [{ syllabusId: syllabus._id, syllabusVersion: syllabus.version, topicKey }];
      await adminSyllabusApi.mapQuestionTopics(question._id, mappings);
      onSaved?.(mappings);
      setMessage('Topic mapping saved.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  return <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-4"><h2 className="font-semibold text-indigo-900">Admin topic mapping</h2><p className="mt-1 text-sm text-indigo-800">Map this question to a published syllabus topic.</p>{loading ? <p className="mt-3 text-sm text-gray-600">Loading published syllabi…</p> : <div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-sm font-medium text-gray-700">Syllabus<select value={syllabusId} onChange={(event) => { setSyllabusId(event.target.value); setTopicKey(''); }} className="mt-1 block w-full rounded border bg-white p-2"><option value="">Select syllabus</option>{syllabi.map((syllabus) => <option key={syllabus._id} value={syllabus._id}>{syllabus.subjectCode} · v{syllabus.version}</option>)}</select></label><label className="text-sm font-medium text-gray-700">Topic<select value={topicKey} onChange={(event) => setTopicKey(event.target.value)} className="mt-1 block w-full rounded border bg-white p-2"><option value="">Select topic</option>{topics.map((topic) => <option key={topic.topicKey} value={topic.topicKey}>{topic.parentTopicKey ? '↳ ' : ''}{topic.name}</option>)}</select></label></div>}{error && <p className="mt-2 text-sm text-red-700">{error}</p>}{message && <p className="mt-2 text-sm text-green-700">{message}</p>}<button disabled={saving || loading} onClick={() => void saveMapping()} className="mt-3 rounded bg-indigo-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save mapping'}</button></section>;
}
