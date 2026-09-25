import { useEffect, useState } from 'react';
import { studyApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Bookmark, Note } from '@/types';
import { getErrorMessage } from '@/lib/utils';

export function StudyActions({ targetType, targetId }: { targetType: string; targetId: string }) {
  const { user } = useAuth();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([studyApi.getBookmarks(targetType), studyApi.getNotes(targetType, targetId)])
      .then(([bookmarkResponse, noteResponse]) => {
        setBookmark((bookmarkResponse.data.bookmarks || []).find((item: Bookmark) => item.targetId === targetId) || null);
        setNotes(noteResponse.data.notes || []);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [targetId, targetType, user]);

  if (!user) return <p className="text-sm text-gray-500">Sign in to save this content.</p>;

  const toggleBookmark = async () => {
    try {
      setError(null);
      if (bookmark) { await studyApi.removeBookmark(bookmark._id); setBookmark(null); }
      else { const response = await studyApi.addBookmark(targetType, targetId); setBookmark(response.data.bookmark); }
    } catch (requestError) { setError(getErrorMessage(requestError)); }
  };

  const addNote = async () => {
    if (!noteBody.trim()) return;
    try { const response = await studyApi.addNote(targetType, targetId, noteBody); setNotes((items) => [response.data.note, ...items]); setNoteBody(''); }
    catch (requestError) { setError(getErrorMessage(requestError)); }
  };

  return <div className="rounded-lg border border-gray-200 bg-gray-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-gray-900">Study tools</h3><button className="rounded border px-3 py-1 text-sm hover:bg-white" onClick={() => void toggleBookmark()}>{bookmark ? '★ Bookmarked' : '☆ Bookmark'}</button></div>{error && <p className="mt-2 text-sm text-red-600">{error}</p>}<div className="mt-3 flex gap-2"><textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} maxLength={5000} placeholder="Add a private study note..." className="min-h-20 flex-1 rounded border bg-white p-2 text-sm"/><button className="self-end rounded bg-primary-700 px-3 py-2 text-sm text-white" onClick={() => void addNote()}>Save note</button></div>{notes.length > 0 && <div className="mt-3 space-y-2">{notes.map((note) => <p key={note._id} className="rounded bg-white p-2 text-sm text-gray-700">{note.body}</p>)}</div>}</div>;
}
