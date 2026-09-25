import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, CheckCircle2, FileText, Scale, ShieldCheck } from 'lucide-react';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { articlesApi } from '@/lib/articlesApi';
import { getErrorMessage } from '@/lib/utils';
import { Article } from '@/types/article';

const studyTracks = [
  {
    icon: BookOpen,
    title: 'Original subject guides',
    description: 'Read structured explanations of legal principles, provisions, authorities, and exam application.',
    href: '/articles?category=subject-guide',
    label: 'Browse subject guides',
  },
  {
    icon: Scale,
    title: 'Case-law learning notes',
    description: 'Study facts, issues, holdings, reasoning, and significance through concise, source-aware notes.',
    href: '/articles?category=case-law',
    label: 'Read case-law notes',
  },
  {
    icon: FileText,
    title: 'Syllabus and topic maps',
    description: 'Move from your university outline to units, topics, key terms, and related practice questions.',
    href: '/syllabi',
    label: 'Open syllabus catalogue',
  },
  {
    icon: Brain,
    title: 'Active revision',
    description: 'Test recall with the question bank, self-authored flashcards, and published practice tests.',
    href: '/questions',
    label: 'Start revision',
  },
];

export function StudyHubPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    articlesApi.getAll({ limit: 6 })
      .then((response) => setArticles(response.data.articles || []))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-10">
      <header className="rounded-2xl bg-gradient-to-br from-slate-950 via-primary-900 to-primary-700 p-8 text-white shadow-lg sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-200">Learn · understand · apply</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-5xl">Your copyright-safe law study hub</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-primary-100">Build understanding with original explanations, structured topic outlines, cited case-learning notes, and practice tools. This is a learning space—not a copy of a textbook.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/articles" className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 font-semibold text-primary-800 transition hover:bg-primary-50">Explore study guides <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link to="/study/articles" className="rounded-lg border border-white/40 px-4 py-2.5 font-semibold text-white transition hover:bg-white/10">Open article index</Link>
          <Link to="/syllabi" className="rounded-lg border border-white/40 px-4 py-2.5 font-semibold text-white transition hover:bg-white/10">View syllabus outlines</Link>
        </div>
      </header>

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" /><div><h2 className="font-semibold text-emerald-950">Original learning material boundary</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-emerald-900">The platform creates its own explanations, revision prompts, outlines, and learning notes. It does not reproduce textbook chapters, paid case reports, or scanned PDF pages. Sources and primary-law references are identified so you can read the authoritative material yourself.</p></div></div>
      </section>

      <section>
        <div className="mb-5"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Choose a route</p><h2 className="mt-2 text-2xl font-bold text-gray-900">Study in the way that suits your next goal</h2></div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {studyTracks.map((track) => { const Icon = track.icon; return <article key={track.title} className="flex h-full flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><Icon className="h-8 w-8 text-primary-700" aria-hidden="true" /><h3 className="mt-4 text-lg font-semibold text-gray-900">{track.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-gray-600">{track.description}</p><Link to={track.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900">{track.label} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article>; })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          <div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Featured reading</p><h2 className="mt-2 text-2xl font-bold text-gray-900">Original guides for your next study session</h2></div><Link to="/study/articles" className="hidden items-center gap-1 text-sm font-semibold text-primary-700 sm:inline-flex">Open article index <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && articles.length === 0 && <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">Study guides are being prepared. Use the syllabus and practice routes below to start learning.</div>}
          {!loading && !error && articles.length > 0 && <div className="grid gap-5 md:grid-cols-2">{articles.map((article) => <article key={article.slug} className="flex h-full flex-col rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700"><span>{article.category.replace('-', ' ')}</span><span className="text-gray-400">·</span><span className="text-gray-500">{article.readingMinutes} min</span></div><h3 className="mt-3 text-xl font-semibold leading-7 text-gray-900">{article.title}</h3><div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm"><p className="font-medium text-gray-900">{article.subject} · Semester {article.semester}</p><p className="mt-1 text-gray-600">{article.chapter}</p><p className="mt-1 font-medium text-primary-800">Topic: {article.topic}</p></div><p className="mt-3 flex-1 text-sm leading-6 text-gray-600">{article.excerpt}</p><div className="mt-3 flex flex-wrap gap-1.5">{article.concepts.slice(0, 3).map((concept) => <span key={concept} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-800">{concept}</span>)}</div><Link to={`/articles/${article.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-900">Read complete guide <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article>)}</div>}
        </div>

        <aside className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" /><h2 className="text-xl font-semibold text-gray-900">A practical study loop</h2></div><ol className="mt-5 space-y-5">{['Read the topic outline and identify the legal question.', 'Use an original guide to understand the rule and its authorities.', 'Test recall with questions, flashcards, or a practice test.', 'Write a short answer in your own words and verify the sources.'].map((step, index) => <li key={step} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-800">{index + 1}</span><p className="text-sm leading-6 text-gray-600">{step}</p></li>)}</ol><div className="mt-6 border-t border-gray-100 pt-5"><p className="text-sm font-semibold text-gray-900">Ready to practise?</p><div className="mt-3 flex flex-wrap gap-2"><Link to="/questions" className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700">Question bank</Link><Link to="/quizzes" className="rounded-lg border border-primary-200 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50">Practice tests</Link></div></div></aside>
      </section>
    </div>
  );
}
