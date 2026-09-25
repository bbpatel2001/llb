import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Gavel, Lightbulb, Scale } from 'lucide-react';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { lawMappingsApi } from '@/lib/lawMappingApi';
import { getErrorMessage } from '@/lib/utils';
import { LawMapping } from '@/types/lawMapping';

export function LawMappingDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [mapping, setMapping] = useState<LawMapping | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    lawMappingsApi.getBySlug(slug)
      .then((response) => setMapping(response.data.mapping))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!mapping) return <ErrorMessage message="Law mapping not found" />;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link to="/law-mapping" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> All law mappings</Link>
      <header className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-700">Semester {mapping.semester} · {mapping.subject}</p><h1 className="mt-2 text-3xl font-bold text-gray-900">{mapping.title}</h1><p className="mt-3 text-lg text-gray-600">{mapping.actName}</p></div>
          <div className="rounded-xl bg-primary-50 p-3 text-primary-700"><Scale className="h-8 w-8" aria-hidden="true" /></div>
        </div>
        <p className="mt-6 max-w-4xl leading-7 text-gray-700">{mapping.summary}</p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary-700" aria-hidden="true" /><h2 className="text-2xl font-semibold text-gray-900">Provisions and legal anchors</h2></div>
        <div className="grid gap-4 md:grid-cols-2">{mapping.provisions.map((provision) => <article key={`${provision.number}-${provision.title}`} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-primary-700">{provision.number}</p><h3 className="mt-1 text-lg font-semibold text-gray-900">{provision.title}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{provision.summary}</p></article>)}</div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl bg-amber-50 p-6 ring-1 ring-amber-100"><div className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-700" aria-hidden="true" /><h2 className="text-xl font-semibold text-amber-950">Core principles</h2></div><ul className="mt-4 space-y-3 text-sm leading-6 text-amber-950">{mapping.principles.map((principle) => <li key={principle} className="flex gap-2"><span className="font-bold text-amber-700">✓</span><span>{principle}</span></li>)}</ul></article>
        <article className="rounded-xl bg-slate-50 p-6 ring-1 ring-slate-200"><div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-slate-700" aria-hidden="true" /><h2 className="text-xl font-semibold text-slate-950">Syllabus connections</h2></div><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">{mapping.syllabusTopics.map((topic) => <li key={topic} className="flex gap-2"><span className="font-bold text-primary-700">•</span><span>{topic}</span></li>)}</ul></article>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100"><div className="flex items-center gap-2"><Gavel className="h-5 w-5 text-primary-700" aria-hidden="true" /><h2 className="text-2xl font-semibold text-gray-900">Leading case laws</h2></div><div className="mt-5 space-y-4">{mapping.caseLaws.map((caseLaw) => <article key={`${caseLaw.name}-${caseLaw.citation}`} className="rounded-lg border border-gray-200 p-5"><h3 className="font-semibold text-gray-900">{caseLaw.name}</h3><p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">{caseLaw.citation}</p><p className="mt-3 text-sm leading-6 text-gray-700">{caseLaw.principle}</p></article>)}</div></section>

      <section className="rounded-xl border border-primary-100 bg-primary-50 p-6"><h2 className="text-lg font-semibold text-primary-950">Exam connection</h2><p className="mt-2 text-sm leading-6 text-primary-900">Use this map to structure a definition, identify the governing provision, explain the principle, cite an authority, and apply the rule to the facts.</p><div className="mt-4 flex flex-wrap gap-2">{mapping.relatedQuestionTypes.map((type) => <span key={type} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-primary-800 ring-1 ring-primary-100">{type}</span>)}</div></section>
    </div>
  );
}
