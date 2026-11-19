import { useEffect, useState } from 'react';
import { Answer } from '@/types';
import { answersApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';

interface Props { answer: Answer; onAnswerUpdated?: (answer: Answer) => void; }

export function AnswerReviewPanel({ answer, onAnswerUpdated }: Props) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const gu = locale === 'gu';
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [summary, setSummary] = useState({ average: answer.ratingAverage || 0, count: answer.ratingCount || 0 });
  const [saving, setSaving] = useState(false);
  const [reviewNotes, setReviewNotes] = useState(answer.reviewNotes || '');
  const [message, setMessage] = useState('');
  const [privateReviews, setPrivateReviews] = useState<Array<{ rating: number; comment?: string; userId?: { name?: string }; createdAt: string }>>([]);

  useEffect(() => { void answersApi.getRatings(answer._id).then((response) => setSummary({ average: response.data.ratingAverage || 0, count: response.data.ratingCount || 0 })).catch(() => undefined); }, [answer._id]);
  useEffect(() => {
    if (!user || !['admin', 'instructor'].includes(user.role)) return;
    void answersApi.getPrivateReviews(answer._id).then((response) => setPrivateReviews(response.data.comments || [])).catch(() => undefined);
  }, [answer._id, user]);

  const submitRating = async () => {
    if (!rating) return;
    setSaving(true); setMessage('');
    try {
      const response = await answersApi.rate(answer._id, rating, comment);
      setSummary({ average: response.data.ratingAverage || 0, count: response.data.ratingCount || 0 });
      setComment('');
      setMessage(response.data.autoApproved ? (gu ? 'રેટિંગની જરૂરી મર્યાદા પૂર્ણ થતાં ઉત્તર આપમેળે મંજૂર થયો.' : 'Automatically approved after the rating threshold was reached.') : (gu ? 'તમારું રેટિંગ અને ટિપ્પણી સાચવવામાં આવ્યા.' : 'Your rating and comment were saved.'));
    } catch { setMessage(gu ? 'રેટિંગ આપવા માટે સાઇન ઇન કરો.' : 'Please sign in to rate this answer.'); }
    finally { setSaving(false); }
  };

  const approve = async () => {
    if (!user || !['admin', 'instructor'].includes(user.role)) return;
    setSaving(true);
    try {
      const response = await answersApi.verify(answer._id, { verified: true, reviewStatus: 'approved', reviewNotes });
      onAnswerUpdated?.(response.data.answer);
      setMessage(gu ? 'એડમિનિસ્ટ્રેટરે ઉત્તર મંજૂર કર્યો.' : 'Answer approved by administrator.');
    } catch { setMessage(gu ? 'સમીક્ષા સ્થિતિ અપડેટ કરી શકાઈ નથી.' : 'Unable to update review status.'); }
    finally { setSaving(false); }
  };

  return <section className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h4 className="font-semibold text-gray-900">{gu ? 'ઉત્તરની ગુણવત્તા' : 'Answer quality'}</h4><p className="text-sm text-gray-600">{summary.count ? (gu ? `${summary.average.toFixed(1)}/5 · ${summary.count} રેટિંગ` : `${summary.average.toFixed(1)}/5 from ${summary.count} rating${summary.count === 1 ? '' : 's'}`) : (gu ? 'હજુ કોઈ રેટિંગ નથી' : 'No ratings yet')}</p></div>
      {user && <div className="flex items-center gap-1" aria-label="Rate answer from 1 to 5">
        {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} className={`text-2xl ${value <= rating ? 'text-amber-500' : 'text-gray-300'}`} title={`${value} star`}>★</button>)}
      </div>}
    </div>
    {user ? <><textarea value={comment} onChange={(event) => setComment(event.target.value)} className="mt-3 w-full rounded border border-gray-300 bg-white p-2 text-sm" rows={2} placeholder={gu ? 'શું ઉમેરવું, કાઢવું, સુધારવું અથવા વધુ સ્પષ્ટ કરવું જોઈએ?' : 'What should be added, deleted, corrected, or better explained?'} />
      <div className="mt-2 flex flex-wrap items-center gap-2"><button type="button" disabled={!rating || saving} onClick={() => void submitRating()} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{gu ? 'રેટિંગ મોકલો' : 'Submit rating'}</button>{message && <span className="text-sm text-gray-700">{message}</span>}</div></> : <p className="mt-3 text-sm text-gray-600">{gu ? 'રેટિંગ આપવા અથવા ખાનગી પ્રતિસાદ આપવા સાઇન ઇન કરો.' : 'Sign in to rate this answer or leave private review feedback.'}</p>}
    {user && ['admin', 'instructor'].includes(user.role) && <div className="mt-4 border-t border-gray-200 pt-3"><label className="text-sm font-semibold text-gray-800">{gu ? 'એડમિન સમીક્ષા નોંધ' : 'Admin review note'}</label><textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm" rows={2} placeholder={gu ? 'શું તપાસ્યું અથવા શું સુધારવું જરૂરી છે તે લખો.' : 'Record what was checked or what must be corrected.'} /><button type="button" disabled={saving} onClick={() => void approve()} className="mt-2 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{gu ? 'ઉત્તર મંજૂર કરો' : 'Approve answer'}</button></div>}
    {user && ['admin', 'instructor'].includes(user.role) && privateReviews.length > 0 && <div className="mt-4 border-t border-gray-200 pt-3"><h5 className="text-sm font-semibold text-gray-800">{gu ? 'ખાનગી સમીક્ષક ટિપ્પણીઓ' : 'Private reviewer comments'}</h5><div className="mt-2 space-y-2">{privateReviews.map((review, index) => <div key={`${review.createdAt}-${index}`} className="rounded border border-gray-200 bg-white p-3 text-sm"><div className="font-medium text-gray-800">{review.userId?.name || (gu ? 'વિદ્યાર્થી' : 'Student')} · {review.rating}/5</div>{review.comment && <p className="mt-1 text-gray-700">{review.comment}</p>}</div>)}</div></div>}
  </section>;
}
