import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Paper } from '@/types';
import { PaperCard } from './PaperCard';
import { EmptyState } from '../Common';

interface PaperListProps {
  papers: Paper[];
}

export function PaperList({ papers }: PaperListProps) {
  const papersBySemester = papers.reduce<Record<number, Paper[]>>((groups, paper) => {
    if (!groups[paper.semester]) groups[paper.semester] = [];
    groups[paper.semester].push(paper);
    return groups;
  }, {});
  const semesters = Object.entries(papersBySemester).sort(([first], [second]) => Number(first) - Number(second));
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(() => new Set(semesters.map(([semester]) => semester)));

  if (papers.length === 0) return <EmptyState message="No question papers found" />;

  const toggleSemester = (semester: string) => {
    setExpandedSemesters((current) => {
      const next = new Set(current);
      if (next.has(semester)) next.delete(semester);
      else next.add(semester);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {semesters.map(([semester, semesterPapers]) => {
        const expanded = expandedSemesters.has(semester);
        return (
          <section key={semester} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <button type="button" onClick={() => toggleSemester(semester)} className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50">
              <span className="text-sm font-bold text-slate-800">Semester {semester}</span>
              <span className="flex items-center gap-2 text-xs text-slate-500">{semesterPapers.length} paper{semesterPapers.length === 1 ? '' : 's'}<ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" /></span>
            </button>
            {expanded && <div className="border-t border-slate-100 bg-slate-50/40 p-4"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{semesterPapers.map((paper) => <PaperCard key={paper._id} paper={paper} />)}</div></div>}
          </section>
        );
      })}
    </div>
  );
}
