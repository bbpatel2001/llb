import { FormEvent, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(token ? null : 'This password reset link is missing its token.');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await authApi.resetPassword(token, password);
      setMessage(response.data.message);
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow"><h1 className="text-2xl font-bold text-gray-900">Reset password</h1><p className="mt-2 text-sm text-gray-600">Choose a new password for your account.</p><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-medium text-gray-700">New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required className="mt-1 w-full rounded border px-3 py-2" /></label>{error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="rounded bg-green-50 p-3 text-sm text-green-700">{message}</p>}<button type="submit" disabled={submitting || !token} className="w-full rounded bg-primary-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{submitting ? 'Saving…' : 'Set new password'}</button></form><p className="mt-6 text-center text-sm"><Link className="font-semibold text-primary-700 hover:underline" to="/login">Back to sign in</Link></p></div>;
}
