import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenText, Building2, CalendarDays, ChevronRight, FileText, Grid2X2, GraduationCap, Hash, List, Plus, Quote, Sparkles } from 'lucide-react';
import { ErrorMessage, LoadingSpinner, PaperFilters, PaperList } from '@/components';
import { papersApi, questionsApi } from '@/lib/api';
import { Paper } from '@/types';
import { getErrorMessage } from '@/lib/utils';

export function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [semester, setSemester] = useState<number | undefined>();
  const [subject, setSubject] = useState('');
  const [university, setUniversity] = useState('');
  const [year, setYear] = useState('');
  const [sortOrder, setSortOrder] = useState('relevant');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPapers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await papersApi.getAll(0, 500);
      const data = response.data.papers || [];
      setPapers(data);
      setUniversities(Array.from(new Set(data.map((paper: Paper) => paper.university))).filter((value): value is string => Boolean(value)).sort());
      const paperYears: string[] = data.map((paper: Paper) => String(paper.year));
      setYears(Array.from(new Set<string>(paperYears)).sort((first, second) => Number(second) - Number(first)));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPapers();
    void questionsApi.getFilters().then((response) => setSubjects(response.data.subjects || [])).catch(() => undefined);
  }, []);

  const filteredPapers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = papers.filter((paper) => {
      const searchableText = [paper.title, paper.subject || '', paper.university, String(paper.year), `semester ${paper.semester}`].join(' ').toLowerCase();
      return (!query || searchableText.includes(query))
        && (semester === undefined || paper.semester === semester)
        && (!subject || paper.subject === subject)
        && (!university || paper.university === university)
        && (!year || String(paper.year) === year);
    });

    return [...filtered].sort((first, second) => {
      if (sortOrder === 'newest') return second.year - first.year;
      if (sortOrder === 'oldest') return first.year - second.year;
      if (sortOrder === 'name') return first.title.localeCompare(second.title);
      if (first.semester !== second.semester) return first.semester - second.semester;
      return second.year - first.year;
    });
  }, [papers, searchQuery, semester, sortOrder, subject, university, year]);

  const popularSubjects = useMemo(() => {
    const counts = new Map<string, number>();
    papers.forEach((paper) => { if (paper.subject) counts.set(paper.subject, (counts.get(paper.subject) || 0) + 1); });
    return Array.from(counts.entries()).sort((first, second) => second[1] - first[1]).slice(0, 8);
  }, [papers]);
  const semestersCovered = new Set(papers.map((paper) => paper.semester)).size;
  const subjectsCovered = new Set(papers.map((paper) => paper.subject).filter(Boolean)).size;

  const clearFilters = () => {
    setSearchQuery('');
    setSemester(undefined);
    setSubject('');
    setUniversity('');
    setYear('');
    setSortOrder('relevant');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
        <Link to="/" className="hover:text-primary-700">Home</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-slate-500">Question Papers</span>
      </div>

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-light-blue text-primary-700"><FileText className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Question Papers</h1>
            <p className="mt-1 text-sm text-slate-500">Browse and study from actual LLB question papers.</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-primary-100 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm sm:flex"><Sparkles className="h-4 w-4 text-warning" aria-hidden="true" />Updated for your exam preparation</div>
      </section>

      <section className="flex items-center gap-4 overflow-hidden rounded-xl border border-primary-100 bg-light-blue px-5 py-3 text-primary-800 shadow-sm">
        <Quote className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
        <div className="min-w-0"><p className="text-xs font-semibold italic">“Education is the most powerful weapon which you can use to change the world.”</p><p className="mt-1 text-[10px] text-secondary">— Nelson Mandela</p></div>
        <GraduationCap className="ml-auto hidden h-14 w-14 shrink-0 text-primary-600/10 sm:block" aria-hidden="true" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0 space-y-4">
          <PaperFilters semester={semester} subject={subject} university={university} year={year} sort={sortOrder} subjects={subjects} universities={universities} years={years} onSemesterChange={setSemester} onSubjectChange={setSubject} onUniversityChange={setUniversity} onYearChange={setYear} onSortChange={setSortOrder} onSearch={setSearchQuery} onClear={clearFilters} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-secondary">Found <span className="font-bold text-main">{filteredPapers.length}</span> papers</p>
            <div className="flex items-center gap-2 text-[10px] text-secondary"><span className="hidden sm:inline">View:</span><button type="button" className="rounded border border-primary-200 bg-light-blue p-1.5 text-primary-700" aria-label="Grid view"><Grid2X2 className="h-3.5 w-3.5" /></button><button type="button" className="rounded p-1.5 hover:bg-slate-100" aria-label="List view"><List className="h-3.5 w-3.5" /></button></div>
          </div>

          {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} onRetry={fetchPapers} /> : <PaperList papers={filteredPapers} />}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 border-b border-slate-100 pb-3"><BookOpenText className="h-4 w-4 text-primary-600" /><h2 className="text-sm font-bold text-primary-700">Quick Stats</h2></div><div className="mt-3 space-y-3"><StatRow icon={<BookOpenText className="h-4 w-4 text-primary-500" />} value={papers.length} label="Total Papers" /><StatRow icon={<GraduationCap className="h-4 w-4 text-success" />} value={semestersCovered} label="Semesters" /><StatRow icon={<Building2 className="h-4 w-4 text-success" />} value={universities.length} label="Universities" /><StatRow icon={<Hash className="h-4 w-4 text-primary-500" />} value={subjectsCovered} label="Subjects Covered" /><StatRow icon={<CalendarDays className="h-4 w-4 text-warning" />} value={years.length} label="Exam Years" /></div></section>
          <section className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><Hash className="h-4 w-4 text-primary-600" /><h2 className="text-sm font-bold text-primary-700">Popular Subjects</h2></div><span className="text-[10px] font-semibold text-primary-600">View All</span></div><div className="mt-3 space-y-2.5">{popularSubjects.map(([name, count]) => <div key={name} className="flex items-center justify-between gap-2 text-[11px] text-slate-600"><span className="truncate">{name}</span><span className="min-w-7 rounded-full bg-light-blue px-1.5 py-0.5 text-center text-[10px] font-semibold text-primary-700">{count}</span></div>)}</div></section>
          <section className="rounded-xl border border-primary-200 bg-gradient-to-br from-white to-light-blue p-4 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue text-primary-600"><Plus className="h-5 w-5" /></span><div><h2 className="text-xs font-bold text-primary-700">Add New Question Paper</h2><p className="mt-1 text-[10px] leading-4 text-slate-500">Help improve our collection by suggesting a paper.</p></div></div><a href="mailto:support@example.com?subject=New%20question%20paper%20suggestion" className="mt-3 flex h-8 items-center justify-center gap-2 rounded-md bg-primary-600 text-[11px] font-semibold text-white transition hover:bg-primary-700"><Plus className="h-3.5 w-3.5" />Suggest Paper</a></section>
        </aside>
      </div>
    </div>
  );
}

function StatRow({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center">{icon}</span><span className="text-sm font-bold text-slate-700">{value}</span><span className="ml-auto text-[10px] text-slate-400">{label}</span></div>;
}
