import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Search, Scale } from 'lucide-react';
import { EmptyState, ErrorMessage, LoadingSpinner } from '@/components';
import { lawMappingsApi } from '@/lib/lawMappingApi';
import { getErrorMessage } from '@/lib/utils';
import { LawMapping } from '@/types/lawMapping';

export function LawMappingPage() {
  const [mappings, setMappings] = useState<LawMapping[]>([]);
  const [search, setSearch] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    lawMappingsApi.getAll({ search: search || undefined, semester: semester ? Number(semester) : undefined })
      .then((response) => setMappings(response.data.mappings))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [search, semester]);

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 p-8 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-white/15 p-3"><Scale className="h-8 w-8" aria-hidden="true" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-100">Legal knowledge map</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Law Mapping</h1>
            <p className="mt-3 max-w-3xl text-primary-50">Follow a legal provision from the Act to its principles, leading cases, syllabus topics, and examination practice.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-white/10 p-3">Act and provisions</div>
          <div className="rounded-lg bg-white/10 p-3">Principles and authorities</div>
          <div className="rounded-lg bg-white/10 p-3">Syllabus and exam links</div>
        </div>
      </header>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
          <label className="relative block">
            <span className="sr-only">Search law mappings</span>
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search an Act, topic, case, or principle..." className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
          <label>
            <span className="sr-only">Filter by semester</span>
            <select value={semester} onChange={(event) => setSemester(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">All semesters</option>
              {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>Semester {value}</option>)}
            </select>
          </label>
        </div>
      </section>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : mappings.length === 0 ? <EmptyState message="No law mappings match your search." /> : (
        <section className="grid gap-5 md:grid-cols-2">
          {mappings.map((mapping) => (
            <article key={mapping.slug} className="flex h-full flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary-700"><BookOpen className="h-4 w-4" aria-hidden="true" /> Semester {mapping.semester}</div>
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-800">{mapping.provisions.length} provisions</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">{mapping.title}</h2>
              <p className="mt-2 text-sm font-medium text-gray-600">{mapping.actName}</p>
              <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{mapping.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">{mapping.tags.slice(0, 4).map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">{tag}</span>)}</div>
              <Link to={`/law-mapping/${mapping.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900">Explore this map <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
