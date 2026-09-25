import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminWorkflowApi } from '@/lib/api';
import { AuditLog } from '@/types';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

export function AdminAuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') { setLoading(false); return; }
    adminWorkflowApi.getAuditLogs({ limit: 100 })
      .then((response) => setLogs(response.data.logs || []))
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== 'admin') return <div className="rounded-lg bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Administrator access required</h1></div>;

  return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-gray-900">Audit History</h1><p className="mt-2 text-gray-600">Administrative publication, import, and mapping actions.</p></div>{error && <ErrorMessage message={error} />}{loading ? <LoadingSpinner /> : <section className="overflow-hidden rounded-lg bg-white shadow"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Resource</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Request</th></tr></thead><tbody className="divide-y">{logs.map((log) => <tr key={log._id}><td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td><td className="px-4 py-3">{log.actorId?.email || 'Unknown'}</td><td className="px-4 py-3 font-mono text-xs">{log.action}</td><td className="px-4 py-3">{log.resourceType}{log.resourceId ? ` / ${log.resourceId}` : ''}</td><td className={`px-4 py-3 font-medium ${log.result === 'success' ? 'text-green-700' : 'text-red-700'}`}>{log.result}</td><td className="px-4 py-3 font-mono text-xs text-gray-500">{log.requestId || '—'}</td></tr>)}</tbody></table>{logs.length === 0 && <p className="p-6 text-gray-500">No audit events recorded yet.</p>}</div></section>}</div>;
}
