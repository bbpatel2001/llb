import { useEffect, useState } from 'react';
import { LoadingSpinner, ErrorMessage, QuestionList } from '@/components';
import { questionsApi } from '@/lib/api';
import { Question } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { SEMESTER1_SUBJECTS } from '@/lib/semester1Subjects';

const types = ['LONG', 'SHORT', 'MCQ', 'CASE_STUDY', 'DESCRIPTIVE'];

export function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSemesters, setSelectedSemesters] = useState<number[]>([]);
  const [semesterMenuOpen, setSemesterMenuOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 50;

  useEffect(() => {
    questionsApi.getFilters().then((response) => setSubjects(response.data.subjects || [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError(null);
        const response = await questionsApi.getAll({ semester: selectedSemesters.length ? selectedSemesters.join(',') : undefined, subject: subject || undefined, type: type || undefined, search: search || undefined, skip: (page - 1) * limit, limit });
        setQuestions(response.data.questions || []); setTotal(response.data.total || 0);
      } catch (err) { setError(getErrorMessage(err)); }
      finally { setLoading(false); }
    };
    load();
  }, [selectedSemesters, subject, type, search, page]);

  const reset = () => { setSelectedSemesters([]); setSubject(''); setType(''); setSearch(''); setSemesterMenuOpen(false); setPage(1); };
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900">Question Bank</h1><p className="text-gray-600 mt-2">Browse all extracted questions by semester, subject, type, or keyword.</p></div>
      <div className="bg-white rounded-lg shadow p-5 grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative">
          <button type="button" onClick={() => setSemesterMenuOpen((open) => !open)} aria-expanded={semesterMenuOpen} className="w-full rounded-lg border bg-white px-3 py-2 text-left">
            {selectedSemesters.length ? `${selectedSemesters.length} semester${selectedSemesters.length === 1 ? '' : 's'} selected` : 'Filter by semester'}
          </button>
          {semesterMenuOpen && <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white p-3 shadow-lg">
            {[1, 2, 3, 4, 5, 6].map((value) => <label key={value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-gray-50">
              <input type="checkbox" checked={selectedSemesters.includes(value)} onChange={(e) => { setSelectedSemesters((current) => e.target.checked ? [...current, value].sort((a, b) => a - b) : current.filter((item) => item !== value)); setSemesterMenuOpen(false); setPage(1); }} />
              <span>Semester {value}</span>
            </label>)}
          </div>}
        </div>
        <select value={subject} onChange={(e) => { setSubject(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2"><option value="">All subjects</option>{(selectedSemesters.length === 1 && selectedSemesters[0] === 1 ? [...SEMESTER1_SUBJECTS] : subjects).map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2"><option value="">All types</option>{types.map((value) => <option key={value} value={value}>{value}</option>)}</select>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search questions..." className="rounded-lg border px-3 py-2 lg:col-span-2" />
        <button type="button" onClick={reset} className="text-sm text-gray-600 hover:text-primary-700 text-left">Clear filters</button>
      </div>
      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : <>
        <div className="flex items-center justify-between"><p className="text-gray-600">Showing {questions.length} of {total} question(s)</p><span className="text-sm text-gray-500">Page {page} of {pages}</span></div>
        <QuestionList questions={questions} />
        {pages > 1 && <div className="flex justify-center gap-3"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Previous</button><button type="button" disabled={page === pages} onClick={() => setPage(page + 1)} className="rounded-lg border px-4 py-2 disabled:opacity-40">Next</button></div>}
      </>}
    </div>
  );
}
