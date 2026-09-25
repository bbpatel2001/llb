import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, GraduationCap } from 'lucide-react';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { syllabiApi } from '@/lib/api';
import { Syllabus, SyllabusUniversitySummary } from '@/types';
import { getErrorMessage } from '@/lib/utils';

function categoryLabel(category?: Syllabus['courseCategory']): string {
  return category ? category.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Course';
}

export function SyllabusPage() {
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [universities, setUniversities] = useState<SyllabusUniversitySummary[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [semester, setSemester] = useState<'all' | number>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      syllabiApi.getUniversities(),
      syllabiApi.getAll({ limit: 100, ...(selectedUniversity === 'all' ? {} : { university: selectedUniversity }) }),
    ])
      .then(([universitiesResponse, syllabiResponse]) => {
        setUniversities(universitiesResponse.data.universities || []);
        setSyllabi(syllabiResponse.data.syllabi || []);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [selectedUniversity]);

  const selectedSummary = useMemo(
    () => universities.find((summary) => summary.university === selectedUniversity),
    [selectedUniversity, universities],
  );
  const semesterOptions = useMemo(() => {
    const semesters = selectedUniversity === 'all'
      ? universities.flatMap((summary) => summary.semesters)
      : selectedSummary?.semesters || syllabi.map((syllabus) => syllabus.semester);
    return [...new Set(semesters)].sort((a, b) => a - b);
  }, [selectedSummary, selectedUniversity, syllabi, universities]);
  const visibleSyllabi = useMemo(
    () => syllabi.filter((syllabus) => semester === 'all' || syllabus.semester === semester),
    [semester, syllabi],
  );
  const grouped = useMemo(() => semesterOptions.map((number) => ({
    number,
    courses: visibleSyllabi.filter((syllabus) => syllabus.semester === number),
  })).filter((group) => group.courses.length > 0), [semesterOptions, visibleSyllabi]);
  const totalCourses = selectedSummary?.syllabusCount || (selectedUniversity === 'all'
    ? universities.reduce((total, summary) => total + summary.syllabusCount, 0)
    : syllabi.length);
  const universityLabel = selectedUniversity === 'all' ? 'All universities' : selectedUniversity;
  const programmeLabel = selectedSummary?.programmes.length === 1 ? selectedSummary.programmes[0] : 'Published law programmes';
  const yearLabel = selectedSummary?.academicYears.length === 1 ? selectedSummary.academicYears[0] : 'Current academic catalogues';

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-gradient-to-br from-primary-900 to-primary-700 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-200">{universityLabel} · {yearLabel}</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Law syllabus catalogue</h1>
        <p className="mt-3 max-w-3xl text-primary-100">Browse published university syllabi as structured courses with metadata, units, learning outcomes and links to original study resources.</p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-white/15 px-3 py-1.5">{totalCourses} courses</span>
          <span className="rounded-full bg-white/15 px-3 py-1.5">{semesterOptions.length} semesters</span>
          <span className="rounded-full bg-white/15 px-3 py-1.5">{universities.length} {universities.length === 1 ? 'university' : 'universities'}</span>
          <span className="rounded-full bg-white/15 px-3 py-1.5">Outline data only</span>
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-gray-900">Course catalogue</h2><p className="mt-1 text-sm text-gray-600">{programmeLabel}. Choose a university and semester to narrow the catalogue.</p></div>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">University<select value={selectedUniversity} onChange={(event) => { setSelectedUniversity(event.target.value); setSemester('all'); }} className="rounded-lg border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"><option value="all">All universities</option>{universities.map((summary) => <option key={summary.university} value={summary.university}>{summary.university}</option>)}</select></label>
          <label className="flex items-center gap-3 text-sm font-medium text-gray-700">Semester<select value={semester} onChange={(event) => setSemester(event.target.value === 'all' ? 'all' : Number(event.target.value))} className="rounded-lg border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"><option value="all">All semesters</option>{semesterOptions.map((number) => <option key={number} value={number}>Semester {number}</option>)}</select></label>
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      {!loading && !error && universities.length === 0 && <div className="rounded-lg bg-white p-8 text-center shadow"><BookOpen className="mx-auto h-10 w-10 text-gray-400" /><p className="mt-3 text-gray-600">No published university syllabi are available yet.</p></div>}
      {!loading && !error && universities.length > 0 && visibleSyllabi.length === 0 && <div className="rounded-lg bg-white p-8 text-center shadow text-gray-600">No courses match this university and semester selection.</div>}

      <div className="space-y-10">
        {grouped.map((group) => (
          <section key={group.number}>
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-gray-200 pb-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Curriculum section</p><h3 className="text-2xl font-bold text-gray-900">Semester {group.number}</h3></div><span className="text-sm text-gray-500">{group.courses.length} courses</span></div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {group.courses.map((syllabus) => (
                <Link key={syllabus._id} to={`/syllabi/${syllabus._id}`} className="group rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-1 hover:shadow-lg hover:ring-primary-200">
                  <div className="flex items-start justify-between gap-3"><div className="rounded-lg bg-primary-100 p-3 text-primary-700"><GraduationCap className="h-6 w-6" /></div><span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-800">{categoryLabel(syllabus.courseCategory)}</span></div>
                  {selectedUniversity === 'all' && <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">{syllabus.university}</p>}
                  <p className="mt-2 text-sm font-bold tracking-wide text-primary-700">Course {syllabus.subjectCode}</p>
                  <h4 className="mt-1 text-xl font-semibold leading-snug text-gray-900 group-hover:text-primary-800">{syllabus.subject}</h4>
                  <p className="mt-3 line-clamp-2 text-sm text-gray-600">{syllabus.description || 'Published structured course outline.'}</p>
                  <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 pt-4 text-sm text-gray-500"><span>{syllabus.topics.filter((topic) => !topic.parentTopicKey).length} units</span><span>{syllabus.topics.length} outline items</span>{syllabus.credits !== undefined && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{syllabus.credits} credits</span>}</div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
