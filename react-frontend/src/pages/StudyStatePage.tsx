import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { studyApi } from '@/lib/api';
import { Bookmark, Note, StudySummary } from '@/types';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

export function StudyStatePage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StudySummary | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [summaryResponse, bookmarksResponse, notesResponse] = await Promise.all([
        studyApi.getSummary(),
        studyApi.getBookmarks(),
        studyApi.getNotes(),
      ]);
      setSummary(summaryResponse.data);
      setBookmarks(bookmarksResponse.data.bookmarks || []);
      setNotes(notesResponse.data.notes || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  if (!user) {
    return <div className="rounded-lg bg-white p-8 text-center shadow"><h1 className="text-2xl font-bold">Sign in to view your study state</h1><Link className="mt-4 inline-block text-primary-700" to="/login">Sign in</Link></div>;
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900">My Study State</h1><p className="mt-2 text-gray-600">Your bookmarks, notes, progress, and spaced-repetition queue.</p></div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} onRetry={() => void load()} />}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            ['Bookmarks', summary.bookmarks],
            ['Notes', summary.notes],
            ['Due flashcards', summary.dueFlashcards],
            ['Tracked areas', summary.progress.reduce((total, item) => total + item.items, 0)],
          ].map(([label, value]) => <div key={String(label)} className="rounded-lg bg-white p-5 shadow"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold text-primary-700">{value}</p></div>)}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-6 shadow"><h2 className="text-xl font-semibold">Bookmarks</h2><div className="mt-4 space-y-3">{bookmarks.length === 0 ? <p className="text-gray-500">No bookmarks yet.</p> : bookmarks.map((bookmark) => <div key={bookmark._id} className="flex items-center justify-between rounded border p-3"><p className="text-sm text-primary-700">{bookmark.targetType}: {bookmark.targetId}</p><button className="text-sm text-red-600" onClick={() => { void studyApi.removeBookmark(bookmark._id).then(() => setBookmarks((items) => items.filter((item) => item._id !== bookmark._id))); }}>Remove</button></div>)}</div></section>
        <section className="rounded-lg bg-white p-6 shadow"><h2 className="text-xl font-semibold">Notes</h2><div className="mt-4 space-y-3">{notes.length === 0 ? <p className="text-gray-500">No notes yet.</p> : notes.map((note) => <div key={note._id} className="rounded border p-3"><p className="text-xs uppercase text-gray-500">{note.targetType}: {note.targetId}</p><p className="mt-2 whitespace-pre-wrap text-gray-800">{note.body}</p></div>)}</div></section>
      </div>
    </div>
  );
}
