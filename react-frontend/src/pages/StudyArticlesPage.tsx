import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock3, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { articlesApi } from '@/lib/articlesApi';
import { getErrorMessage } from '@/lib/utils';
import { Article } from '@/types/article';

const PAGE_SIZE = 5;

const categoryLabels: Record<Article['category'], string> = {
  'subject-guide': 'Subject guide',
  'case-law': 'Case-law note',
  'exam-skills': 'Exam skills',
  'legal-research': 'Legal research',
};

function compactList(items: string[]): string {
  return items.join(' · ');
}

export function StudyArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await articlesApi.getAll({
          search: search.trim() || undefined,
          skip: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        });
        setArticles(response.data.articles || []);
        setTotal(response.data.total || 0);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadArticles();
  }, [page, search]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      <header className="max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Study catalogue</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Articles, sections, and concepts</h1>
        <p className="mt-3 text-lg leading-7 text-gray-600">Scan the complete study material in a compact table. Each row gives the article path, its sections, and the concepts covered before you open the full guide.</p>
      </header>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <label className="relative block max-w-2xl">
          <span className="sr-only">Search the study catalogue</span>
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" aria-hidden="true" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search articles, sections, or concepts..." className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </label>
      </section>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
            <p>Showing {articles.length} of {total} article{total === 1 ? '' : 's'}</p>
            <span>Page {page} of {pages}</span>
          </div>

          {articles.length === 0 ? <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">No articles, sections, or concepts match your search.</div> : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-[1050px] w-full border-collapse text-left">
                  <caption className="sr-only">Paginated article catalogue with sections and concepts</caption>
                  <thead className="bg-primary-950 text-xs uppercase tracking-wide text-white">
                    <tr>
                      <th scope="col" className="w-[25%] px-5 py-4 font-semibold">Article</th>
                      <th scope="col" className="w-[24%] px-5 py-4 font-semibold">Chapter · subject · topic</th>
                      <th scope="col" className="w-[25%] px-5 py-4 font-semibold">Sections</th>
                      <th scope="col" className="w-[20%] px-5 py-4 font-semibold">Concepts</th>
                      <th scope="col" className="w-[6%] px-5 py-4 font-semibold">Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {articles.map((article) => (
                      <tr key={article.slug} className="align-top transition hover:bg-primary-50/40">
                        <td className="px-5 py-5">
                          <Link to={`/articles/${article.slug}`} className="font-semibold leading-6 text-primary-800 hover:text-primary-950 hover:underline">{article.title}</Link>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500"><span>{categoryLabels[article.category]}</span><span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{article.readingMinutes} min</span></div>
                        </td>
                        <td className="px-5 py-5 text-sm leading-6 text-gray-700"><p className="font-medium text-gray-900">Semester {article.semester} · {article.subject}</p><p className="mt-1">{article.chapter}</p><p className="mt-1 text-primary-800">{article.topic}</p></td>
                        <td className="px-5 py-5 text-sm leading-6 text-gray-700"><p className="max-h-[4.5rem] overflow-hidden">{compactList(article.sections.map((section) => section.heading))}</p><p className="mt-2 text-xs text-gray-500">{article.sections.length} sections</p></td>
                        <td className="px-5 py-5 text-sm leading-6 text-gray-700"><p className="max-h-[4.5rem] overflow-hidden">{compactList(article.concepts)}</p><p className="mt-2 text-xs text-gray-500">{article.concepts.length} concepts</p></td>
                        <td className="px-5 py-5"><Link to={`/articles/${article.slug}`} className="text-sm font-semibold text-primary-700 hover:underline">View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pages > 1 && <nav className="flex items-center justify-center gap-4" aria-label="Article catalogue pagination"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous</button><span className="text-sm text-gray-600">Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight className="h-4 w-4" aria-hidden="true" /></button></nav>}
        </>
      )}
    </div>
  );
}
