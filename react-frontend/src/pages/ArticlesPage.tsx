import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock3, Search } from 'lucide-react';
import { EmptyState, ErrorMessage, LoadingSpinner } from '@/components';
import { articlesApi } from '@/lib/articlesApi';
import { getErrorMessage, formatDate } from '@/lib/utils';
import { Article } from '@/types/article';

const categoryLabels: Record<Article['category'], string> = {
  'subject-guide': 'Subject guides',
  'case-law': 'Case-law notes',
  'exam-skills': 'Exam skills',
  'legal-research': 'Legal research',
};

export function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    articlesApi.getAll({ search: search || undefined, category: category || undefined })
      .then((response) => setArticles(response.data.articles))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Learn the law</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Articles</h1>
        <p className="mt-3 text-lg leading-7 text-gray-600">Original, topic-focused explanations that connect legal principles with authorities, syllabus topics, and exam preparation.</p>
      </header>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <div className="grid gap-3 md:grid-cols-[1fr_13rem]">
          <label className="relative block"><span className="sr-only">Search articles</span><Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search articles, subjects, or topics..." className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></label>
          <label><span className="sr-only">Filter articles by category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        </div>
      </section>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : articles.length === 0 ? <EmptyState message="No articles match your search." /> : (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => <article key={article.slug} className="flex h-full flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-primary-700"><span>{categoryLabels[article.category]}</span><span className="inline-flex items-center gap-1 text-gray-500"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> {article.readingMinutes} min</span></div><h2 className="mt-4 text-xl font-semibold leading-7 text-gray-900">{article.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{article.excerpt}</p><div className="mt-5 flex items-center gap-2 text-xs text-gray-500"><BookOpen className="h-4 w-4" aria-hidden="true" />{article.subject}<span aria-hidden="true">·</span>Semester {article.semester}<span aria-hidden="true">·</span>{formatDate(article.publishedAt)}</div><p className="mt-3 text-sm font-medium text-primary-800">{article.chapter}</p><p className="mt-2 text-sm leading-6 text-gray-700">Topic: {article.topic}</p><div className="mt-4 flex flex-wrap gap-2">{article.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">{tag}</span>)}</div><Link to={`/articles/${article.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900">Read article <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article>)}
        </section>
      )}
    </div>
  );
}
