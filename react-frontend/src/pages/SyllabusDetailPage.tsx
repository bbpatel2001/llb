import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { syllabiApi } from '@/lib/api';
import { Question, Syllabus, SyllabusTopic } from '@/types';
import { getErrorMessage } from '@/lib/utils';

function categoryLabel(category: Syllabus['courseCategory']): string {
  return category.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function TopicTree({ topics, selectedTopicKey, onSelect }: { topics: SyllabusTopic[]; selectedTopicKey: string | null; onSelect: (topicKey: string) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => Object.fromEntries(topics.filter((topic) => !topic.parentTopicKey).map((topic) => [topic.topicKey, true])));
  const childrenOf = (parentTopicKey: string) => topics.filter((topic) => topic.parentTopicKey === parentTopicKey).sort((a, b) => a.order - b.order);
  const roots = topics.filter((topic) => !topic.parentTopicKey).sort((a, b) => a.order - b.order);

  const renderTopic = (topic: SyllabusTopic, depth = 0): JSX.Element => {
    const children = childrenOf(topic.topicKey);
    const isExpanded = expanded[topic.topicKey] ?? false;
    const selected = selectedTopicKey === topic.topicKey;
    return (
      <div key={topic.topicKey}>
        <div className="flex items-center gap-1">
          {children.length > 0 ? <button aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${topic.name}`} onClick={() => setExpanded((current) => ({ ...current, [topic.topicKey]: !isExpanded }))} className="rounded p-1 text-gray-500 hover:bg-gray-100">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button> : <span className="w-6" />}
          <button onClick={() => onSelect(topic.topicKey)} className={`flex-1 rounded-lg px-3 py-2 text-left text-sm ${selected ? 'bg-primary-100 font-semibold text-primary-900' : 'text-gray-700 hover:bg-gray-50'}`} style={{ marginLeft: `${Math.max(0, depth - 0) * 0.5}rem` }}>
            <span className="mr-2 text-xs font-semibold uppercase text-primary-700">{topic.kind === 'unit' ? `Unit ${topic.order}` : topic.sourceId}</span>{topic.name}
          </button>
        </div>
        {isExpanded && children.length > 0 && <div className="ml-5 border-l border-gray-200 pl-1">{children.map((child) => renderTopic(child, depth + 1))}</div>}
      </div>
    );
  };

  return <div className="space-y-1">{roots.map((topic) => renderTopic(topic))}</div>;
}

export function SyllabusDetailPage() {
  const { syllabusId } = useParams<{ syllabusId: string }>();
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!syllabusId) return;
    setLoading(true);
    Promise.all([syllabiApi.getById(syllabusId), syllabiApi.getTopics(syllabusId)])
      .then(([syllabusResponse, topicsResponse]) => {
        const loadedSyllabus = syllabusResponse.data.syllabus as Syllabus;
        const loadedTopics = topicsResponse.data.topics as SyllabusTopic[];
        setSyllabus(loadedSyllabus);
        setTopics(loadedTopics);
        setSelectedTopicKey(loadedTopics.find((topic) => topic.kind === 'unit')?.topicKey || loadedTopics[0]?.topicKey || null);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [syllabusId]);

  useEffect(() => {
    if (!syllabusId || !selectedTopicKey) return;
    setQuestionsLoading(true);
    syllabiApi.getQuestions(syllabusId, selectedTopicKey)
      .then((response) => setQuestions(response.data.questions || []))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setQuestionsLoading(false));
  }, [selectedTopicKey, syllabusId]);

  const selectedTopic = useMemo(() => topics.find((topic) => topic.topicKey === selectedTopicKey), [selectedTopicKey, topics]);
  const unitCount = topics.filter((topic) => topic.kind === 'unit' || !topic.parentTopicKey).length;

  if (loading) return <LoadingSpinner />;
  if (error && !syllabus) return <ErrorMessage message={error} />;
  if (!syllabus) return <div className="rounded-lg bg-white p-8 text-center shadow">Syllabus not found.</div>;

  return (
    <div className="space-y-6">
      <header><Link to="/syllabi" className="text-sm font-medium text-primary-700 hover:underline">← All semesters</Link><div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-700">Semester {syllabus.semester} · Course {syllabus.subjectCode}</p><h1 className="mt-2 max-w-4xl text-3xl font-bold text-gray-900">{syllabus.subject}</h1><p className="mt-2 text-gray-600">{syllabus.university} · {syllabus.programme} · {syllabus.academicYear}</p></div><span className="rounded-full bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-800">{categoryLabel(syllabus.courseCategory)}</span></div>{syllabus.description && <p className="mt-4 max-w-4xl text-gray-700">{syllabus.description}</p>}</header>
      {error && <ErrorMessage message={error} />}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[['Lectures/week', syllabus.lectureHoursPerWeek], ['Other/week', syllabus.otherHoursPerWeek], ['Total/week', syllabus.weeklyHours], ['Credits', syllabus.credits ?? '—'], ['Marks', syllabus.maxMarks ?? syllabus.assessmentPattern?.totalMarks ?? '—']].map(([label, value]) => <div key={label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-gray-900">{value}</p></div>)}
      </section>
      {syllabus.assessmentPattern?.components && syllabus.assessmentPattern.components.length > 0 && <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><h2 className="text-lg font-semibold text-gray-900">Assessment breakdown</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{syllabus.assessmentPattern.components.map((component) => <div key={component.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm"><span className="text-gray-700">{component.name}</span><span className="font-semibold text-gray-900">{component.marks} marks</span></div>)}</div></section>}

      <section className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100"><div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">Course outline</h2><span className="text-xs text-gray-500">{unitCount} units</span></div><p className="mt-1 text-xs text-gray-500">Select any unit or subtopic.</p><div className="mt-4"><TopicTree topics={topics} selectedTopicKey={selectedTopicKey} onSelect={setSelectedTopicKey} /></div></aside>
        <main className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><h2 className="text-xl font-semibold text-gray-900">Course objectives</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">{syllabus.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></section>
            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><h2 className="text-xl font-semibold text-gray-900">Expected outcomes</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700">{syllabus.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></section>
          </div>

          {selectedTopic && <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary-700">{selectedTopic.kind === 'unit' ? `Unit ${selectedTopic.order}` : `Topic ${selectedTopic.sourceId}`}</p><h2 className="mt-1 text-2xl font-semibold text-gray-900">{selectedTopic.name}</h2></div>{selectedTopic.estimatedHours !== undefined && <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">Approx. {selectedTopic.estimatedHours} hours</span>}</div>{selectedTopic.description && <p className="mt-3 text-gray-700">{selectedTopic.description}</p>}{selectedTopic.keyTerms.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{selectedTopic.keyTerms.map((term) => <span key={term} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{term}</span>)}</div>}{selectedTopic.relatedSections.length > 0 && <p className="mt-4 text-sm text-gray-500">Related provisions: {selectedTopic.relatedSections.join(', ')}</p>}</section>}

          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><h2 className="font-semibold text-emerald-900">Copyright-safe study-material boundary</h2><p className="mt-1 text-sm leading-6 text-emerald-800">This page stores the syllabus outline and official/bibliographic source metadata only. It does not reproduce textbook chapters, paid case reports, or PDF pages. Future notes, flashcards and answers will be newly written and will cite official or public primary sources where appropriate.</p></div></div></section>

          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold text-gray-900">Mapped questions</h2><span className="text-sm text-gray-500">{questions.length} loaded</span></div>{questionsLoading ? <div className="py-8"><LoadingSpinner /></div> : questions.length === 0 ? <p className="mt-5 text-gray-500">No published questions have been mapped to this unit or topic yet.</p> : <div className="mt-4 space-y-3">{questions.map((question) => <Link key={question._id} to={`/questions/${question._id}`} className="block rounded border p-4 transition hover:border-primary-400 hover:bg-primary-50"><div className="flex items-start gap-3"><FileText className="mt-1 h-5 w-5 shrink-0 text-primary-700" /><div><p className="font-medium text-gray-900">Question {question.questionNumber}</p><p className="mt-1 text-sm text-gray-700">{question.questionText}</p><p className="mt-2 text-xs text-gray-500">{question.marks || 0} marks · {question.type}</p></div></div></Link>)}</div>}</section>

          {syllabus.references.length > 0 && <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><h2 className="text-xl font-semibold text-gray-900">Official and primary-source references</h2><p className="mt-1 text-sm text-gray-500">References are stored as metadata; no protected source text is copied into the platform.</p><ul className="mt-4 grid gap-2 sm:grid-cols-2">{syllabus.references.map((reference) => <li key={reference} className="flex gap-2 text-sm text-gray-700"><BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />{reference}</li>)}</ul></section>}
        </main>
      </section>
    </div>
  );
}
