"use client";

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import QuestionCard from '@/components/QuestionCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { questionsApi } from '@/lib/api';

interface Question {
  _id: string;
  text: string;
  type: 'MCQ' | 'SHORT' | 'LONG' | 'DESCRIPTIVE';
  subject: string;
  semester: number;
  year?: number;
  paperId?: string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const semesters = [1, 2, 3, 4, 5, 6];
  const types = ['MCQ', 'SHORT', 'LONG', 'DESCRIPTIVE'];

  useEffect(() => {
    fetchQuestions();
  }, [selectedSemester, selectedType, page]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        limit: 20,
        skip: (page - 1) * 20,
      };

      if (selectedSemester) {
        params.semester = selectedSemester;
      }

      if (selectedType) {
        params.type = selectedType;
      }

      const response = await questionsApi.getAll(params);
      setQuestions(response.data.questions || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      setPage(1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Question Papers</h1>
        <p className="text-gray-600 mt-2">Browse and study questions from LLB examination papers</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <select
              value={selectedSemester || ''}
              onChange={(e) => {
                setSelectedSemester(e.target.value ? parseInt(e.target.value) : null);
                setPage(1);
              }}
              className="appearance-none px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="">All Semesters</option>
              {semesters.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={selectedType || ''}
              onChange={(e) => {
                setSelectedType(e.target.value || null);
                setPage(1);
              }}
              className="appearance-none px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white cursor-pointer"
            >
              <option value="">All Types</option>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {(selectedSemester || selectedType) && (
            <button
              onClick={() => {
                setSelectedSemester(null);
                setSelectedType(null);
                setPage(1);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {error && <ErrorMessage message={error} onRetry={fetchQuestions} />}

      {loading ? (
        <LoadingSpinner />
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">No questions found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {questions.map((question) => (
              <QuestionCard
                key={question._id}
                id={question._id}
                text={question.text}
                type={question.type}
                subject={question.subject}
                semester={question.semester}
                year={question.year}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <span className="text-gray-600">Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={questions.length < 20}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
