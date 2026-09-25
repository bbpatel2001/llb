import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tags,
  UploadCloud,
  Users,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { useAuth } from '@/context/AuthContext';
import { adminDashboardApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

interface CountMap {
  [key: string]: number;
}

interface AdminActivity {
  _id: string;
  createdAt: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  result: 'success' | 'failure';
  actorId?: { name?: string; email?: string } | string;
}

interface AdminOverview {
  content: {
    papers: number;
    questions: { total: number; readable: number; published: number; bySemester: CountMap; byType: CountMap };
    answers: { total: number; verified: number; averageQualityScore: number | null };
    flashcardDecks: number;
    timelines: number;
    cases: number;
    syllabi: CountMap;
  };
  workflow: {
    importsByStatus: CountMap;
    stagedQuestionsByStatus: CountMap;
    draftSyllabiAwaitingApproval: number;
    unmappedPublishedQuestions: number;
  };
  users: { total: number; active: number; byRole: CountMap };
  recentActivity: AdminActivity[];
}

type MetricTone = 'blue' | 'violet' | 'emerald' | 'amber' | 'slate' | 'rose';

const numberFormatter = new Intl.NumberFormat('en-IN');

function count(values: CountMap, key: string): number {
  return values[key] || 0;
}

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: string; detail: string; tone: MetricTone }) {
  const tones: Record<MetricTone, string> = {
    blue: 'from-blue-500 to-cyan-500 bg-blue-50 text-blue-700',
    violet: 'from-violet-500 to-purple-500 bg-violet-50 text-violet-700',
    emerald: 'from-emerald-500 to-teal-500 bg-emerald-50 text-emerald-700',
    amber: 'from-amber-500 to-orange-500 bg-amber-50 text-amber-700',
    slate: 'from-slate-500 to-slate-700 bg-slate-50 text-slate-700',
    rose: 'from-rose-500 to-pink-500 bg-rose-50 text-rose-700',
  };
  const [gradient, background, text] = tones[tone].split(' ');

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute right-0 top-0 h-1 w-full bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-950">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{detail}</p>
        </div>
        <div className={`rounded-xl p-3 ${background} ${text}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
      </div>
    </div>
  );
}

function ProgressBar({ value, total, color = 'bg-primary-600' }: { value: number; total: number; color?: string }) {
  const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} /></div>;
}

function QuickAction({ to, icon: Icon, title, description, tone }: { to: string; icon: LucideIcon; title: string; description: string; tone: string }) {
  return (
    <Link to={to} className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-sm">
      <div className={`rounded-lg p-2 ${tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
      <div className="min-w-0 flex-1"><p className="font-semibold text-gray-900">{title}</p><p className="mt-1 text-xs leading-5 text-gray-500">{description}</p></div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:text-primary-600" aria-hidden="true" />
    </Link>
  );
}

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async (isRefresh = false) => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const response = await adminDashboardApi.getOverview();
      setOverview(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { void loadOverview(); }, [loadOverview]);

  const attentionItems = useMemo(() => {
    if (!overview) return [];
    const pendingImports = count(overview.workflow.importsByStatus, 'needs_review');
    const pendingQuestions = count(overview.workflow.stagedQuestionsByStatus, 'pending') + count(overview.workflow.stagedQuestionsByStatus, 'needs_changes');
    const failedImports = count(overview.workflow.importsByStatus, 'failed');
    return [
      { label: 'Imports waiting for review', value: pendingImports, to: '/admin/review', tone: 'amber', icon: UploadCloud },
      { label: 'Staged questions needing decisions', value: pendingQuestions, to: '/admin/review', tone: 'violet', icon: ClipboardCheck },
      { label: 'Draft syllabi awaiting approval', value: overview.workflow.draftSyllabiAwaitingApproval, to: '/admin/syllabi', tone: 'blue', icon: FileCheck2 },
      { label: 'Published questions without topic mapping', value: overview.workflow.unmappedPublishedQuestions, to: '/admin/mappings', tone: 'rose', icon: Tags },
      { label: 'Failed imports', value: failedImports, to: '/admin/review', tone: 'rose', icon: XCircle },
    ].filter((item) => item.value > 0);
  }, [overview]);

  if (!user || user.role !== 'admin') {
    return <div className="rounded-2xl bg-white p-10 text-center shadow-sm"><ShieldCheck className="mx-auto h-10 w-10 text-gray-400" /><h1 className="mt-4 text-2xl font-bold text-gray-900">Administrator access required</h1><p className="mt-2 text-gray-500">This workspace is available only to platform administrators.</p></div>;
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-primary-800 px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100"><Sparkles className="h-3.5 w-3.5" /> Admin command center</div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Good to see you, {user.name.split(' ')[0]}.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Monitor content quality, keep review queues moving, and maintain a reliable study experience across the platform.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-xs uppercase tracking-wider text-blue-200">Signed in as</p><p className="mt-1 text-sm font-semibold">{user.email}</p></div>
            <button type="button" onClick={() => void loadOverview(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/20 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing' : 'Refresh data'}</button>
          </div>
        </div>
      </section>

      {error && <ErrorMessage message={error} onRetry={() => void loadOverview()} />}
      {loading ? <LoadingSpinner /> : overview && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard icon={FileText} label="Papers" value={formatNumber(overview.content.papers)} detail="Source documents" tone="blue" />
            <MetricCard icon={BookOpen} label="Questions" value={formatNumber(overview.content.questions.total)} detail={`${formatNumber(overview.content.questions.readable)} readable`} tone="violet" />
            <MetricCard icon={ClipboardCheck} label="Review queue" value={formatNumber(count(overview.workflow.importsByStatus, 'needs_review'))} detail="Imports to review" tone="amber" />
            <MetricCard icon={FileCheck2} label="Published syllabi" value={formatNumber(count(overview.content.syllabi, 'published'))} detail={`${formatNumber(count(overview.content.syllabi, 'draft'))} drafts`} tone="emerald" />
            <MetricCard icon={Users} label="Active users" value={formatNumber(overview.users.active)} detail={`${formatNumber(overview.users.total)} total accounts`} tone="slate" />
            <MetricCard icon={Layers3} label="Flashcard decks" value={formatNumber(overview.content.flashcardDecks)} detail="Available study decks" tone="rose" />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-gray-950">Needs attention</h2><p className="mt-1 text-sm text-gray-500">Prioritized work for a healthy content pipeline.</p></div><Activity className="h-5 w-5 text-primary-600" aria-hidden="true" /></div>
              {attentionItems.length === 0 ? <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" /><span><strong>Everything looks clear.</strong> No review blockers were detected.</span></div> : <div className="mt-5 divide-y divide-gray-100">{attentionItems.map((item) => { const Icon = item.icon; return <Link key={item.label} to={item.to} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className={`rounded-lg p-2 ${item.tone === 'amber' ? 'bg-amber-100 text-amber-700' : item.tone === 'violet' ? 'bg-violet-100 text-violet-700' : item.tone === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}><Icon className="h-4 w-4" /></div><span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-primary-700">{item.label}</span><span className="rounded-full bg-gray-100 px-2.5 py-1 text-sm font-bold text-gray-900">{formatNumber(item.value)}</span><ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-600" /></Link>; })}</div>}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-gray-950">Question coverage</h2><p className="mt-1 text-sm text-gray-500">Readable and published content status.</p></div><BookOpen className="h-5 w-5 text-violet-600" aria-hidden="true" /></div><div className="mt-5"><div className="flex items-end justify-between text-sm"><span className="text-gray-600">Readable questions</span><strong className="text-gray-950">{formatNumber(overview.content.questions.readable)} / {formatNumber(overview.content.questions.total)}</strong></div><div className="mt-2"><ProgressBar value={overview.content.questions.readable} total={overview.content.questions.total} color="bg-violet-600" /></div><div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 p-3 text-sm"><span className="text-gray-600">Published questions</span><strong className="text-gray-900">{formatNumber(overview.content.questions.published)}</strong></div></div><div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4">{Object.entries(overview.content.questions.bySemester).slice(0, 6).map(([semester, value]) => <div key={semester}><div className="mb-1 flex justify-between text-xs"><span className="text-gray-500">Semester {semester}</span><span className="font-semibold text-gray-700">{formatNumber(value)}</span></div><ProgressBar value={value} total={overview.content.questions.total} color="bg-blue-500" /></div>)}</div></div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-gray-950">Content inventory</h2><p className="mt-1 text-sm text-gray-500">A quick view of the knowledge base.</p></div><Layers3 className="h-5 w-5 text-emerald-600" aria-hidden="true" /></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{[[ 'Answers', overview.content.answers.total ], [ 'Case laws', overview.content.cases ], [ 'Timelines', overview.content.timelines ], [ 'Published syllabi', count(overview.content.syllabi, 'published') ], [ 'Draft syllabi', count(overview.content.syllabi, 'draft') ], [ 'Admin users', count(overview.users.byRole, 'admin') ]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-xl font-bold text-gray-900">{formatNumber(Number(value))}</p></div>)}</div><div className="mt-6"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Question types</p><div className="space-y-3">{Object.entries(overview.content.questions.byType).slice(0, 5).map(([type, value]) => <div key={type}><div className="mb-1 flex justify-between text-xs"><span className="text-gray-600">{labelize(type)}</span><span className="font-medium text-gray-800">{formatNumber(value)}</span></div><ProgressBar value={value} total={overview.content.questions.total} color="bg-emerald-500" /></div>)}</div></div></div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold text-gray-950">Answer quality</h2><p className="mt-1 text-sm text-gray-500">Verification progress across generated answers.</p></div><ShieldCheck className="h-5 w-5 text-blue-600" aria-hidden="true" /></div><div className="mt-6 flex items-center gap-5"><div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-blue-100 bg-blue-50"><span className="text-xl font-bold text-blue-700">{overview.content.answers.total > 0 ? `${Math.round((overview.content.answers.verified / overview.content.answers.total) * 100)}%` : '—'}</span></div><div><p className="text-sm font-semibold text-gray-900">{formatNumber(overview.content.answers.verified)} verified answers</p><p className="mt-1 text-sm text-gray-500">out of {formatNumber(overview.content.answers.total)} total answers</p><div className="mt-3 w-48"><ProgressBar value={overview.content.answers.verified} total={overview.content.answers.total} color="bg-blue-600" /></div></div></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-blue-50 p-4"><p className="text-xs text-blue-700">Average quality score</p><p className="mt-1 text-2xl font-bold text-blue-950">{overview.content.answers.averageQualityScore === null ? '—' : `${overview.content.answers.averageQualityScore}/10`}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Active accounts</p><p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(overview.users.active)}</p></div></div></div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-gray-950">Recent admin activity</h2><p className="mt-1 text-sm text-gray-500">The latest publication, review, and mapping events.</p></div><Link to="/admin/audit" className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-900">View full audit log <ArrowRight className="h-4 w-4" /></Link></div>{overview.recentActivity.length === 0 ? <p className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">No administrative events have been recorded yet.</p> : <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400"><tr><th className="pb-3 pr-4">Event</th><th className="pb-3 pr-4">Actor</th><th className="pb-3 pr-4">Resource</th><th className="pb-3">Time</th></tr></thead><tbody className="divide-y divide-gray-100">{overview.recentActivity.map((activity) => { const actor = typeof activity.actorId === 'object' ? activity.actorId?.name || activity.actorId?.email : 'Administrator'; return <tr key={activity._id}><td className="py-3 pr-4"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${activity.result === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} /><span className="font-medium text-gray-800">{labelize(activity.action)}</span></div></td><td className="py-3 pr-4 text-gray-500">{actor}</td><td className="py-3 pr-4 text-gray-500">{labelize(activity.resourceType)}{activity.resourceId ? ` · ${activity.resourceId.slice(0, 10)}…` : ''}</td><td className="whitespace-nowrap py-3 text-gray-400">{new Date(activity.createdAt).toLocaleString()}</td></tr>; })}</tbody></table></div>}</section>

          <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-gray-950">Quick actions</h2><p className="mt-1 text-sm text-gray-500">Jump directly into the workflows you use most.</p></div><Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" /></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><QuickAction to="/admin/review" icon={ClipboardCheck} title="Review imports" description="Approve, reject, or promote staged content." tone="bg-amber-100 text-amber-700" /><QuickAction to="/admin/syllabi" icon={BookOpen} title="Manage syllabi" description="Create drafts, upload PDFs, and publish versions." tone="bg-blue-100 text-blue-700" /><QuickAction to="/admin/mappings" icon={Tags} title="Map topics" description="Connect published questions to syllabus topics." tone="bg-violet-100 text-violet-700" /><QuickAction to="/admin/flashcards" icon={Layers3} title="Flashcard diagnostics" description="Find stored cards hidden from students." tone="bg-rose-100 text-rose-700" /><QuickAction to="/admin/audit" icon={Activity} title="Audit history" description="Review the complete administrative activity trail." tone="bg-slate-100 text-slate-700" /><QuickAction to="/questions" icon={FileText} title="Browse question bank" description="Inspect the content currently available to learners." tone="bg-emerald-100 text-emerald-700" /></div></section>
        </>
      )}
    </div>
  );
}
