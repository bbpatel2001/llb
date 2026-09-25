import { useState, useEffect } from 'react';
import { StatsCard, LoadingSpinner, ErrorMessage } from '@/components';
import { statsApi } from '@/lib/api';
import { Stats } from '@/types';
import { FileText, BookOpen, HelpCircle, PieChart } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils';

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await statsApi.getOverview();
      setStats(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of platform statistics and content</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchStats} />
      ) : stats ? (
        <>
          {/* Main Stats */}
          <div className="grid md:grid-cols-4 gap-6">
            <StatsCard
              icon={FileText}
              label="Total Papers"
              value={stats.totalPapers}
              color="primary"
            />
            <StatsCard
              icon={HelpCircle}
              label="Total Questions"
              value={stats.totalQuestions}
              color="blue"
            />
            <StatsCard
              icon={BookOpen}
              label="Question Types"
              value={Object.keys(stats.byType).length}
              color="green"
            />
            <StatsCard
              icon={PieChart}
              label="Subjects"
              value={Object.keys(stats.bySubject).length}
              color="purple"
            />
          </div>

          {/* Breakdown */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* By Semester */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Questions by Semester</h2>
              <div className="space-y-2">
                {Object.entries(stats.bySemester).map(([semester, count]) => (
                  <div key={semester} className="flex justify-between items-center">
                    <span className="text-gray-600">Semester {semester}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-32 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(stats.bySemester))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-gray-900 font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* By Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Questions by Type</h2>
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-600 capitalize">{type}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-32 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(stats.byType))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-gray-900 font-medium w-12 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Subjects */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Subjects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats.bySubject)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([subject, count]) => (
                  <div key={subject} className="bg-gradient-to-br from-primary-50 to-blue-50 rounded p-4 border border-primary-100">
                    <p className="text-sm font-medium text-gray-700 truncate">{subject}</p>
                    <p className="text-2xl font-bold text-primary-600 mt-2">{count}</p>
                  </div>
                ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
