import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, ExternalLink } from 'lucide-react';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { articlesApi } from '@/lib/articlesApi';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { Article } from '@/types/article';

const categoryLabels: Record<Article['category'], string> = {
  'subject-guide': 'Subject guide',
  'case-law': 'Case-law note',
  'exam-skills': 'Exam skills',
  'legal-research': 'Legal research',
};

export function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    articlesApi.getBySlug(slug).then((response) => setArticle(response.data.article)).catch((requestError) => setError(getErrorMessage(requestError))).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!article) return <ErrorMessage message="Article not found" />;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> All articles</Link>
      <header className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100"><div className="flex flex-wrap items-center gap-3 text-sm font-semibold uppercase tracking-wide text-primary-700"><span>{categoryLabels[article.category]}</span><span className="text-gray-300">·</span><span className="inline-flex items-center gap-1 text-gray-500 normal-case tracking-normal"><Clock3 className="h-4 w-4" aria-hidden="true" /> {article.readingMinutes} minute read</span></div><h1 className="mt-4 text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">{article.title}</h1><p className="mt-4 text-lg leading-8 text-gray-600">{article.excerpt}</p><div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500"><span>{article.subject}</span><span>Semester {article.semester}</span><span>Published {formatDate(article.publishedAt)}</span><span>Updated {formatDate(article.updatedAt)}</span></div><div className="mt-5 flex flex-wrap gap-2">{article.tags.map((tag) => <span key={tag} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800">{tag}</span>)}</div></header>

      <section className="rounded-xl bg-white p-7 shadow-sm ring-1 ring-gray-100" aria-labelledby="topic-context-heading"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-700">Study context</p><h2 id="topic-context-heading" className="mt-1 text-2xl font-semibold text-gray-900">Understand the topic in context</h2></div><span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800">Semester {article.semester}</span></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-lg bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Chapter</p><p className="mt-2 font-medium leading-6 text-gray-900">{article.chapter}</p></div><div className="rounded-lg bg-gray-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</p><p className="mt-2 font-medium leading-6 text-gray-900">{article.subject}</p></div><div className="rounded-lg bg-primary-50 p-4 sm:col-span-2"><p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Topic</p><p className="mt-2 text-lg font-semibold leading-7 text-primary-950">{article.topic}</p></div></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div><h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Core concepts</h3><div className="mt-3 flex flex-wrap gap-2">{article.concepts.map((concept) => <span key={concept} className="rounded-full border border-primary-200 bg-white px-3 py-1.5 text-sm text-primary-900">{concept}</span>)}</div></div><div><h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">By the end of this guide</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-gray-700">{article.learningObjectives.map((objective) => <li key={objective} className="flex gap-2"><span className="font-bold text-emerald-600">✓</span><span>{objective}</span></li>)}</ul></div></div></section>

      <article className="space-y-8">{article.sections.map((section) => <section key={section.heading} className="rounded-xl bg-white p-7 shadow-sm ring-1 ring-gray-100"><h2 className="text-2xl font-semibold text-gray-900">{section.heading}</h2><div className="mt-4 space-y-4 text-base leading-8 text-gray-700">{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{section.bullets && <ul className="mt-5 space-y-3 rounded-lg bg-gray-50 p-5 text-sm leading-6 text-gray-700">{section.bullets.map((bullet) => <li key={bullet} className="flex gap-2"><span className="font-bold text-primary-700">•</span><span>{bullet}</span></li>)}</ul>}</section>)}</article>

      <section className="rounded-xl bg-emerald-50 p-7 ring-1 ring-emerald-100"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden="true" /><h2 className="text-xl font-semibold text-emerald-950">Key takeaways</h2></div><ul className="mt-4 grid gap-3 sm:grid-cols-2">{article.keyTakeaways.map((takeaway) => <li key={takeaway} className="flex gap-2 text-sm leading-6 text-emerald-900"><span className="font-bold">✓</span><span>{takeaway}</span></li>)}</ul></section>

      <section className="grid gap-6 md:grid-cols-2"><div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900"><BookOpen className="h-5 w-5 text-primary-700" aria-hidden="true" /> Sources and authorities</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700">{article.sources.map((source) => <li key={source} className="flex gap-2"><span className="text-primary-700">•</span><span>{source}</span></li>)}</ul></div><div className="rounded-xl bg-primary-50 p-6 ring-1 ring-primary-100"><h2 className="text-lg font-semibold text-primary-950">Continue studying</h2><div className="mt-4 space-y-3">{article.relatedLinks.map((link) => link.href.startsWith('/') ? <Link key={link.href} to={link.href} className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-primary-800 hover:bg-primary-100"><span>{link.label}</span><ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 text-sm font-medium text-primary-800 hover:bg-primary-100"><span>{link.label}</span><ExternalLink className="h-4 w-4" aria-hidden="true" /></a>)}</div></div></section>
    </div>
  );
}
