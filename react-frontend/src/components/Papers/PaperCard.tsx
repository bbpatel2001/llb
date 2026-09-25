import { Link } from 'react-router-dom';
import { BookOpen, Calendar, ChevronRight, FileText } from 'lucide-react';
import { Paper } from '@/types';

interface PaperCardProps {
  paper: Paper;
}

export function PaperCard({ paper }: PaperCardProps) {
  return (
    <Link to={`/papers/${paper._id}`} className="group block overflow-hidden rounded-xl border border-slate-200 border-l-[3px] border-l-primary-500 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-light-blue text-primary-600"><FileText className="h-4 w-4" aria-hidden="true" /></span>
          <h3 className="min-w-0 flex-1 text-sm font-bold leading-5 text-slate-800 line-clamp-2">{paper.title}</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500"><span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />{paper.year}</span><span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />Semester {paper.semester}</span></div>
        <p className="mt-2 truncate text-[10px] text-slate-400">{paper.university}</p>
        {paper.subject && <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-light-blue px-2 py-1 text-[9px] font-medium uppercase text-primary-700">{paper.subject}</span></div>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-[10px] font-semibold text-primary-700"><span>View Paper</span><ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></div>
    </Link>
  );
}
