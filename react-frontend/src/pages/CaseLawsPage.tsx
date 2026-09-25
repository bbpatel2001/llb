import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  BookOpenText,
  ChevronRight,
  Filter,
  Grid2X2,
  Hash,
  Landmark,
  List,
  Plus,
  Quote,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
} from 'lucide-react';
import { CaseLawList, ErrorMessage, LoadingSpinner } from '@/components';
import { caseLawsApi } from '@/lib/api';
import { CaseLaw } from '@/types';
import { getErrorMessage } from '@/lib/utils';

export function CaseLawsPage() {
  const [searchParams] = useSearchParams();
  const [caseLaws, setCaseLaws] = useState<CaseLaw[]>([]);
  const [totalCases, setTotalCases] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [courtFilter, setCourtFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [actFilter, setActFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('relevant');

  useEffect(() => {
    setLoading(true);
    setError(null);
    caseLawsApi.getAll({ search: searchQuery || undefined, court: courtFilter || undefined, limit: 25, skip: (page - 1) * 25 })
      .then((response) => {
        setCaseLaws(response.data.cases || []);
        setTotalCases(response.data.total || 0);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [courtFilter, page, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [courtFilter, searchQuery]);

  const availableCourts = useMemo(() => Array.from(new Set(caseLaws.map((caseLaw) => caseLaw.court))).sort(), [caseLaws]);
  const availableYears = useMemo(() => Array.from(new Set(caseLaws.map((caseLaw) => caseLaw.year))).sort((a, b) => b - a), [caseLaws]);
  const availableSubjects = useMemo(() => Array.from(new Set(caseLaws.flatMap((caseLaw) => caseLaw.relatedTopics || []))).sort(), [caseLaws]);
  const availableActs = useMemo(() => Array.from(new Set(caseLaws.flatMap((caseLaw) => caseLaw.applicableActs || []))).sort(), [caseLaws]);

  const visibleCaseLaws = useMemo(() => {
    const filtered = caseLaws.filter((caseLaw) => {
      const matchesYear = !yearFilter || String(caseLaw.year) === yearFilter;
      const matchesSubject = !subjectFilter || caseLaw.relatedTopics?.includes(subjectFilter);
      const matchesAct = !actFilter || caseLaw.applicableActs?.includes(actFilter);
      return matchesYear && matchesSubject && matchesAct;
    });

    return [...filtered].sort((first, second) => {
      if (sortOrder === 'newest') return second.year - first.year;
      if (sortOrder === 'oldest') return first.year - second.year;
      if (sortOrder === 'name') return first.name.localeCompare(second.name);
      return (second.frequency || 0) - (first.frequency || 0);
    });
  }, [actFilter, caseLaws, sortOrder, subjectFilter, yearFilter]);

  const popularTopics = useMemo(() => {
    const counts = new Map<string, number>();
    caseLaws.forEach((caseLaw) => caseLaw.relatedTopics?.forEach((topic) => counts.set(topic, (counts.get(topic) || 0) + 1)));
    return Array.from(counts.entries()).sort((first, second) => second[1] - first[1]).slice(0, 8);
  }, [caseLaws]);

  const resetFilters = () => {
    setSearchQuery('');
    setCourtFilter('');
    setYearFilter('');
    setSubjectFilter('');
    setActFilter('');
    setSortOrder('relevant');
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => event.preventDefault();
  const supremeCourtCases = caseLaws.filter((caseLaw) => caseLaw.court.toLowerCase().includes('supreme court')).length;
  const highCourtCases = caseLaws.filter((caseLaw) => caseLaw.court.toLowerCase().includes('high court')).length;
  const landmarkCases = caseLaws.filter((caseLaw) => (caseLaw.frequency || 0) >= 5).length;
  const totalPages = Math.max(1, Math.ceil(totalCases / 25));
  const foundCount = yearFilter || subjectFilter || actFilter ? visibleCaseLaws.length : totalCases || visibleCaseLaws.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
        <Link to="/" className="hover:text-primary-700">Home</Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-slate-500">Case Laws</span>
      </div>

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-light-blue text-primary-700"><Scale className="h-6 w-6" aria-hidden="true" /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Case Laws</h1>
            <p className="mt-1 text-sm text-slate-500">Explore important judgments and judicial principles for your law studies.</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-primary-100 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm sm:flex">
          <Sparkles className="h-4 w-4 text-warning" aria-hidden="true" />
          Updated for your exam preparation
        </div>
      </section>

      <section className="flex items-center gap-4 overflow-hidden rounded-xl border border-primary-100 bg-light-blue px-5 py-3 text-primary-800 shadow-sm">
        <Quote className="h-5 w-5 shrink-0 text-primary-600" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-semibold italic">“Law is not merely a set of rules, but a guide to a just society.”</p>
          <p className="mt-1 text-[10px] text-secondary">— Justice P. N. Bhagwati</p>
        </div>
        <Landmark className="ml-auto hidden h-14 w-14 shrink-0 text-primary-600/10 sm:block" aria-hidden="true" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input type="search" placeholder="Search case name, citation, judge, topic..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100" />
              </div>
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"><Search className="h-3.5 w-3.5" aria-hidden="true" />Search</button>
              <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary-200 px-4 text-xs font-semibold text-primary-700 transition hover:bg-light-blue"><Filter className="h-3.5 w-3.5" aria-hidden="true" />Advanced Search</button>
            </form>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <FilterSelect label="Court" value={courtFilter} onChange={setCourtFilter} options={availableCourts} allLabel="All Courts" />
              <FilterSelect label="Year" value={yearFilter} onChange={setYearFilter} options={availableYears.map(String)} allLabel="All Years" />
              <FilterSelect label="Subject" value={subjectFilter} onChange={setSubjectFilter} options={availableSubjects} allLabel="All Subjects" />
              <FilterSelect label="Law / Act" value={actFilter} onChange={setActFilter} options={availableActs} allLabel="All Laws" />
              <FilterSelect label="Sort By" value={sortOrder} onChange={setSortOrder} options={['relevant', 'newest', 'oldest', 'name']} optionLabels={{ relevant: 'Most Relevant', newest: 'Newest First', oldest: 'Oldest First', name: 'A–Z' }} />
            </div>
            <button type="button" onClick={resetFilters} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:text-primary-900"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Clear Filters</button>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-secondary">Found <span className="font-bold text-main">{foundCount}</span> case laws</p>
            <div className="flex items-center gap-2 text-[10px] text-secondary">
              <span className="hidden sm:inline">View:</span>
              <button type="button" className="rounded border border-primary-200 bg-light-blue p-1.5 text-primary-700" aria-label="Grid view"><Grid2X2 className="h-3.5 w-3.5" /></button>
              <button type="button" className="rounded p-1.5 hover:bg-slate-100" aria-label="List view"><List className="h-3.5 w-3.5" /></button>
              {totalPages > 1 && <div className="ml-2 flex items-center gap-1 border-l border-border pl-2"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded px-1.5 py-1 text-primary-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page">‹</button><span className="rounded border border-primary-200 bg-light-blue px-2 py-1 font-semibold text-primary-700">{page}</span><span className="px-0.5">…</span><span className="px-0.5">{totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded px-1.5 py-1 text-primary-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page">›</button></div>}
            </div>
          </div>

          {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : <CaseLawList caseLaws={visibleCaseLaws} />}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3"><BarChart3 className="h-4 w-4 text-primary-600" /><h2 className="text-sm font-bold text-primary-700">Quick Stats</h2></div>
            <div className="mt-3 space-y-3">
              <StatRow icon={<BookOpenText className="h-4 w-4 text-primary-500" />} value={totalCases || caseLaws.length} label="Total Case Laws" />
              <StatRow icon={<span className="text-warning">★</span>} value={landmarkCases} label="Landmark Cases" />
              <StatRow icon={<Landmark className="h-4 w-4 text-success" />} value={supremeCourtCases} label="Supreme Court" />
              <StatRow icon={<Landmark className="h-4 w-4 text-success" />} value={highCourtCases} label="High Courts" />
              <StatRow icon={<Hash className="h-4 w-4 text-primary-500" />} value={availableSubjects.length} label="Subjects Covered" />
            </div>
          </section>

          <section className="rounded-xl border border-primary-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><div className="flex items-center gap-2"><Hash className="h-4 w-4 text-primary-600" /><h2 className="text-sm font-bold text-primary-700">Popular Topics</h2></div><span className="text-[10px] font-semibold text-primary-600">View All</span></div>
            <div className="mt-3 space-y-2.5">{popularTopics.map(([topic, count]) => <div key={topic} className="flex items-center justify-between gap-2 text-[11px] text-slate-600"><span className="truncate">{topic}</span><span className="min-w-7 rounded-full bg-light-blue px-1.5 py-0.5 text-center text-[10px] font-semibold text-primary-700">{count}</span></div>)}</div>
          </section>

          <section className="rounded-xl border border-primary-200 bg-gradient-to-br from-white to-light-blue p-4 shadow-sm">
            <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-light-blue text-primary-600"><Plus className="h-5 w-5" /></span><div><h2 className="text-xs font-bold text-primary-700">Add New Case Law</h2><p className="mt-1 text-[10px] leading-4 text-slate-500">Help improve our database by suggesting a new case law.</p></div></div>
            <a href="mailto:support@example.com?subject=New%20case%20law%20suggestion" className="mt-3 flex h-8 items-center justify-center gap-2 rounded-md bg-primary-600 text-[11px] font-semibold text-white transition hover:bg-primary-700"><Plus className="h-3.5 w-3.5" />Add Case Law</a>
          </section>
        </aside>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel, optionLabels }: { label: string; value: string; onChange: (value: string) => void; options: string[]; allLabel?: string; optionLabels?: Record<string, string> }) {
  return (
    <label className="block text-[10px] font-semibold text-slate-500">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] font-normal text-slate-600 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100">
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((option) => <option key={option} value={option}>{optionLabels?.[option] || option}</option>)}
      </select>
    </label>
  );
}

function StatRow({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center">{icon}</span><span className="text-sm font-bold text-slate-700">{value}</span><span className="ml-auto text-[10px] text-slate-400">{label}</span></div>;
}
