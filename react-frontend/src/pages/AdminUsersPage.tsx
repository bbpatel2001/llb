import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adminApi } from '@/lib/api';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

interface RegisteredUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  verified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (userId: string, payload: { role?: string; active?: boolean }) => {
    try {
      const response = await adminApi.updateUser(userId, payload);
      setUsers((current) => current.map((item) => item._id === userId ? response.data.user : item));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const deleteUser = async (registeredUser: RegisteredUser) => {
    if (!window.confirm(`Delete ${registeredUser.email}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(registeredUser._id);
      setUsers((current) => current.filter((item) => item._id !== registeredUser._id));
      setTotal((current) => Math.max(0, current - 1));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }

    adminApi.getUsers({ limit: 100 })
      .then((response) => {
        setUsers(response.data.users || []);
        setTotal(response.data.total || 0);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== 'admin') {
    return <div className="rounded-lg bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Administrator access required</h1></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registered Users</h1>
        <p className="mt-2 text-gray-600">View accounts registered on the LLB Platform.</p>
      </div>
      {error && <ErrorMessage message={error} />}
      {loading ? <LoadingSpinner /> : (
        <section className="overflow-hidden rounded-lg bg-white shadow">
          <div className="flex items-center justify-between border-b px-4 py-4">
            <h2 className="font-semibold text-gray-900">All users</h2>
            <span className="text-sm text-gray-500">{total} registered</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Last login</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((registeredUser) => (
                  <tr key={registeredUser._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{registeredUser.name}</td>
                    <td className="px-4 py-3 text-gray-600">{registeredUser.email}</td>
                    <td className="px-4 py-3 capitalize">{registeredUser.role}</td>
                    <td className="px-4 py-3">
                      <span className={registeredUser.active ? 'text-green-700' : 'text-red-700'}>
                        {registeredUser.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">{registeredUser.verified ? 'Verified' : 'Unverified'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{new Date(registeredUser.createdAt).toLocaleString()}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">{registeredUser.lastLoginAt ? new Date(registeredUser.lastLoginAt).toLocaleString() : 'Never'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <select value={registeredUser.role} onChange={(event) => void updateUser(registeredUser._id, { role: event.target.value })} className="rounded border px-2 py-1 text-xs" aria-label={`Role for ${registeredUser.email}`}>
                          <option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option>
                        </select>
                        <button type="button" onClick={() => void updateUser(registeredUser._id, { active: !registeredUser.active })} className="rounded border px-2 py-1 text-xs text-gray-700">{registeredUser.active ? 'Disable' : 'Enable'}</button>
                        <button type="button" onClick={() => void deleteUser(registeredUser)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="p-6 text-gray-500">No registered users found.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
