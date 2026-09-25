import { useState } from 'react';
import { Bookmark, ChevronRight, FileText, MoreVertical, Share2 } from 'lucide-react';
import { CaseLaw } from '@/types';

interface CaseLawCardProps {
  caseLaw: CaseLaw;
}

function excerpt(value: string, length = 180) {
  return value.length > length ? `${value.slice(0, length).trim()}…` : value;
}

export function CaseLawCard({ caseLaw }: CaseLawCardProps) {
  const [expanded, setExpanded] = useState(false);
  const topics = caseLaw.relatedTopics?.slice(0, 3) || [];
  const isLandmark = (caseLaw.frequency || 0) >= 5;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 border-l-[3px] border-l-primary-500 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-100 text-primary-600"><FileText className="h-4 w-4" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-bold leading-5 text-slate-800">{caseLaw.name}</h3>
              {isLandmark && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700">★ Landmark Case</span>}
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">{caseLaw.citation}</p>
          </div>
          <button type="button" className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label={`More actions for ${caseLaw.name}`}><MoreVertical className="h-4 w-4" /></button>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500"><span>♜ {caseLaw.court}</span><span>◷ {caseLaw.year}</span></div>
        {topics.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{topics.map((topic, index) => <span key={topic} className={`rounded-full px-2 py-1 text-[9px] font-medium ${index === 0 ? 'bg-sky-100 text-primary-700' : index === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'}`}>{topic}</span>)}</div>}
        <p className="mt-3 text-[11px] leading-5 text-slate-600">{excerpt(caseLaw.facts)}</p>

        {expanded && <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-600"><p><strong className="text-slate-700">Issue:</strong> {caseLaw.issue}</p><p><strong className="text-slate-700">Held:</strong> {caseLaw.held}</p><p><strong className="text-slate-700">Ratio:</strong> {caseLaw.ratio}</p>{caseLaw.significance && <p><strong className="text-slate-700">Significance:</strong> {caseLaw.significance}</p>}</div>}
      </div>

      <div className="flex items-center gap-4 border-t border-slate-100 px-4 py-2.5 text-[10px] font-semibold">
        <button type="button" onClick={() => setExpanded((value) => !value)} className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-900">{expanded ? 'Hide Details' : 'View Details'} <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} /></button>
        <button type="button" className="ml-auto inline-flex items-center gap-1.5 text-slate-400 hover:text-primary-700"><Bookmark className="h-3.5 w-3.5" />Add to Library</button>
        <button type="button" onClick={() => void navigator.clipboard?.writeText(window.location.href)} className="inline-flex items-center gap-1.5 text-slate-400 hover:text-primary-700"><Share2 className="h-3.5 w-3.5" />Share</button>
      </div>
    </article>
  );
}
