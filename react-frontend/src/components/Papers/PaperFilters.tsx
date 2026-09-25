import { FormEvent, useState } from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';

interface PaperFiltersProps {
  semester?: number;
  subject: string;
  university: string;
  year: string;
  sort: string;
  subjects: string[];
  universities: string[];
  years: string[];
  onSemesterChange: (semester: number | undefined) => void;
  onSubjectChange: (subject: string) => void;
  onUniversityChange: (university: string) => void;
  onYearChange: (year: string) => void;
  onSortChange: (sort: string) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
}

export function PaperFilters({ semester, subject, university, year, sort, subjects, universities, years, onSemesterChange, onSubjectChange, onUniversityChange, onYearChange, onSortChange, onSearch, onClear }: PaperFiltersProps) {
  const [query, setQuery] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSearch(query.trim()); };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search paper title, subject, university..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100" aria-label="Search question papers" />
        </div>
        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"><Search className="h-3.5 w-3.5" aria-hidden="true" />Search</button>
        <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary-200 px-4 text-xs font-semibold text-primary-700 transition hover:bg-light-blue"><Filter className="h-3.5 w-3.5" aria-hidden="true" />Advanced Search</button>
      </form>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <FilterSelect label="Semester" value={semester === undefined ? '' : String(semester)} onChange={(value) => onSemesterChange(value ? Number(value) : undefined)} options={['1', '2', '3', '4', '5', '6']} allLabel="All Semesters" optionLabels={{ 1: 'Semester 1', 2: 'Semester 2', 3: 'Semester 3', 4: 'Semester 4', 5: 'Semester 5', 6: 'Semester 6' }} />
        <FilterSelect label="Subject" value={subject} onChange={onSubjectChange} options={subjects} allLabel="All Subjects" />
        <FilterSelect label="University" value={university} onChange={onUniversityChange} options={universities} allLabel="All Universities" />
        <FilterSelect label="Year" value={year} onChange={onYearChange} options={years} allLabel="All Years" />
        <FilterSelect label="Sort By" value={sort} onChange={onSortChange} options={['relevant', 'newest', 'oldest', 'name']} optionLabels={{ relevant: 'Semester → Year', newest: 'Newest First', oldest: 'Oldest First', name: 'A–Z' }} />
      </div>
      <button type="button" onClick={() => { setQuery(''); onClear(); }} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:text-primary-900"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Clear Filters</button>
    </section>
  );
}

function FilterSelect({ label, value, onChange, options, allLabel, optionLabels }: { label: string; value: string; onChange: (value: string) => void; options: string[]; allLabel?: string; optionLabels?: Record<string, string> }) {
  return (
    <label className="block text-[10px] font-semibold text-slate-500">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] font-normal text-slate-600 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-100">
        {allLabel && <option value="">{allLabel}</option>}
        {options.map((option) => <option key={option} value={option}>{optionLabels?.[option] || option}</option>)}
      </select>
    </label>
  );
}
