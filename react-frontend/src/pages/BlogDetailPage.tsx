import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2 } from 'lucide-react';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { blogsApi } from '@/lib/blogsApi';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { BlogCategory, BlogPost } from '@/types/blog';

const categoryLabels: Record<BlogCategory, string> = {
  'study-advice': 'Study advice',
  'platform-journal': 'Platform journal',
  'legal-learning': 'Legal learning',
};

export function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    blogsApi.getBySlug(slug).then((response) => setPost(response.data.post)).catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!post) return <ErrorMessage message="Blog post not found" />;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link to="/blogs" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> All blogs</Link>
      <header className="rounded-2xl bg-slate-900 p-8 text-white shadow-lg"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">{categoryLabels[post.category]}</p><h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1><p className="mt-4 text-lg leading-8 text-slate-300">{post.excerpt}</p><div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400"><span>{post.author}</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" aria-hidden="true" /> {formatDate(post.publishedAt)}</span><span>{post.readingMinutes} minute read</span></div><div className="mt-5 flex flex-wrap gap-2">{post.tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">{tag}</span>)}</div></header>

      <article className="space-y-8">{post.sections.map((section) => <section key={section.heading} className="rounded-xl bg-white p-7 shadow-sm ring-1 ring-gray-100"><h2 className="text-2xl font-semibold text-gray-900">{section.heading}</h2><div className="mt-4 space-y-4 text-base leading-8 text-gray-700">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{section.bullets && <ul className="mt-5 space-y-3 rounded-lg bg-gray-50 p-5 text-sm leading-6 text-gray-700">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="font-bold text-primary-700">•</span><span>{bullet}</span></li>)}</ul>}</section>)}</article>

      <section className="grid gap-6 md:grid-cols-2"><div className="rounded-xl bg-emerald-50 p-7 ring-1 ring-emerald-100"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" /><h2 className="text-xl font-semibold text-emerald-950">Sources</h2></div><ul className="mt-4 space-y-3 text-sm leading-6 text-emerald-900">{post.sources.map((source) => <li key={source} className="flex gap-2"><span className="font-bold">•</span><span>{source}</span></li>)}</ul></div><div className="rounded-xl bg-primary-50 p-7 ring-1 ring-primary-100"><h2 className="text-xl font-semibold text-primary-950">Continue learning</h2><p className="mt-2 text-sm leading-6 text-primary-900">Move from this editorial post to structured articles and connected legal maps.</p><div className="mt-5 space-y-3"><Link to="/articles" className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-primary-800 hover:bg-primary-100"><BookOpen className="h-4 w-4" aria-hidden="true" /> Read articles</Link><Link to="/law-mapping" className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-primary-800 hover:bg-primary-100"><BookOpen className="h-4 w-4" aria-hidden="true" /> Explore law mapping</Link></div></div></section>
    </div>
  );
}
