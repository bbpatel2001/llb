import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isRegister) await register(name, email, password);
      else await login(email, password);
      const destination = (location.state as { from?: string } | null)?.from || '/dashboard';
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setSubmitting(true);
    setForgotMessage(null);
    setError(null);
    try {
      const response = await authApi.forgotPassword(email);
      setForgotMessage(response.data.message);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="text-2xl font-bold text-gray-900">{isRegister ? 'Create your account' : 'Sign in'}</h1>
      <p className="mt-2 text-sm text-gray-600">
        {isRegister ? 'Create a student account to take quizzes and generate study content.' : 'Sign in to access quizzes and authenticated study actions.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {isRegister && (
          <label className="block text-sm font-medium text-gray-700">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} className="mt-1 w-full rounded border px-3 py-2" />
          </label>
        )}
        <label className="block text-sm font-medium text-gray-700">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="mt-1 w-full rounded border px-3 py-2" />
        </label>

        {!isRegister && <button type="button" onClick={() => setForgotMode((value) => !value)} className="text-sm font-semibold text-primary-700 hover:underline">{forgotMode ? 'Back to sign in' : 'Forgot password?'}</button>}

        {forgotMode && !isRegister && (
          <div className="rounded bg-blue-50 p-3 text-sm text-blue-800">
            Enter your email, then check your inbox for a reset link.
            <button type="button" onClick={handleForgotPassword} disabled={submitting || !email} className="mt-3 block rounded bg-primary-600 px-3 py-2 font-semibold text-white disabled:opacity-50">{submitting ? 'Sending…' : 'Send reset link'}</button>
          </div>
        )}

        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {forgotMessage && <p className="rounded bg-green-50 p-3 text-sm text-green-700">{forgotMessage}</p>}
        {!forgotMode && <button type="submit" disabled={submitting} className="w-full rounded bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
          {submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>}
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
        <Link className="font-semibold text-primary-700 hover:underline" to={isRegister ? '/login' : '/register'}>
          {isRegister ? 'Sign in' : 'Register'}
        </Link>
      </p>
    </div>
  );
}
