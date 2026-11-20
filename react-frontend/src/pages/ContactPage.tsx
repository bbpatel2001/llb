import { FormEvent, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { contactApi } from '@/lib/api';
import { TurnstileWidget } from '@/components/TurnstileWidget';
import { getErrorMessage } from '@/lib/utils';

export function ContactPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);
    setError(null);
    try {
      const response = await contactApi.submit({ name, email, category, message, turnstileToken });
      setStatus(response.data.message);
      setMessage('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100"><h1 className="text-3xl font-bold text-gray-900">Contact / Feedback</h1><p className="mt-2 text-gray-600">Tell us about a problem, suggest content, or share an idea to improve the LLB Platform.</p><form onSubmit={submit} className="mt-6 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-gray-700">Name<input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} className="mt-1 w-full rounded border px-3 py-2" /></label><label className="block text-sm font-medium text-gray-700">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-1 w-full rounded border px-3 py-2" /></label></div><label className="block text-sm font-medium text-gray-700">Topic<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded border px-3 py-2"><option value="general">General question</option><option value="bug">Report a problem</option><option value="content">Content issue</option><option value="suggestion">Suggestion</option><option value="account">Account help</option></select></label><label className="block text-sm font-medium text-gray-700">Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} required minLength={10} maxLength={5000} rows={7} className="mt-1 w-full rounded border px-3 py-2" /></label><TurnstileWidget onToken={setTurnstileToken} />{error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}{status && <p className="rounded bg-green-50 p-3 text-sm text-green-700">{status}</p>}<button type="submit" disabled={submitting} className="rounded bg-primary-600 px-5 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-50">{submitting ? 'Submitting…' : 'Send feedback'}</button></form></div>;
}
