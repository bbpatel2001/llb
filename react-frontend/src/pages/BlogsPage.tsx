import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Search } from 'lucide-react';
import { EmptyState, ErrorMessage, LoadingSpinner } from '@/components';
import { blogsApi } from '@/lib/blogsApi';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { BlogCategory, BlogPost } from '@/types/blog';

const categoryLabels: Record<BlogCategory, string> = {
  'study-advice': 'Study advice',
  'platform-journal': 'Platform journal',
  'legal-learning': 'Legal learning',
};

export function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    blogsApi.getAll({ search: search || undefined, category: category || undefined })
      .then((response) => setPosts(response.data.posts))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-slate-900 p-8 text-white shadow-lg"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">From the platform</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Blogs</h1><p className="mt-3 max-w-3xl text-lg leading-7 text-slate-300">Dated study guidance, legal-learning reflections, and editorial notes about building a reliable law-learning habit.</p></header>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100"><div className="grid gap-3 md:grid-cols-[1fr_13rem]"><label className="relative block"><span className="sr-only">Search blogs</span><Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search blog posts..." className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500" /></label><label><span className="sr-only">Filter blogs by category</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"><option value="">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></section>

      {loading ? <LoadingSpinner /> : error ? <ErrorMessage message={error} /> : posts.length === 0 ? <EmptyState message="No blog posts match your search." /> : <section className="grid gap-5 md:grid-cols-2">{posts.map((post) => <article key={post.slug} className="flex h-full flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-primary-700"><span>{categoryLabels[post.category]}</span><span className="inline-flex items-center gap-1 text-gray-500"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {formatDate(post.publishedAt)}</span></div><h2 className="mt-4 text-xl font-semibold leading-7 text-gray-900">{post.title}</h2><p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{post.excerpt}</p><div className="mt-5 text-xs text-gray-500">{post.author} <span aria-hidden="true">·</span> {post.readingMinutes} min read</div><div className="mt-4 flex flex-wrap gap-2">{post.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">{tag}</span>)}</div><Link to={`/blogs/${post.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900">Read post <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article>)}</section>}
    </div>
  );
}
