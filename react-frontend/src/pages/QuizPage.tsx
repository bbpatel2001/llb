import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { quizzesApi } from '@/lib/api';
import { Quiz, QuizQuestion, Question } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { ErrorMessage, LoadingSpinner } from '@/components';
import { getErrorMessage } from '@/lib/utils';

function populatedQuestion(entry: QuizQuestion): Question | null {
  return typeof entry.questionId === 'object' ? entry.questionId : null;
}

export function QuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    totalMarks: number;
    percentage: string;
    feedback: string;
    correctAnswers?: number;
    totalQuestions?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    setError(null);
    const request = quizId ? quizzesApi.getById(quizId) : quizzesApi.getAll({ limit: 50 });
    request
      .then((response) => {
        if (quizId) setQuiz(response.data.quiz);
        else setQuizzes(response.data.quizzes || []);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [authLoading, quizId]);

  const startQuiz = async () => {
    if (!quiz) return;
    setWorking(true);
    setError(null);
    try {
      const response = await quizzesApi.start(quiz._id);
      setAttemptId(response.data.attemptId);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setWorking(false);
    }
  };

  const submitQuiz = async () => {
    if (!attemptId || !quiz) return;
    setWorking(true);
    setError(null);
    try {
      for (const entry of quiz.questions) {
        const question = populatedQuestion(entry);
        const selectedAnswer = question ? answers[question._id] : undefined;
        if (question && selectedAnswer) {
          await quizzesApi.submitAnswer(attemptId, question._id, selectedAnswer);
        }
      }
      const response = await quizzesApi.submit(attemptId);
      setResult(response.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setWorking(false);
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => navigate(quizId ? `/quizzes/${quizId}` : '/quizzes')} />;

  if (!quizId) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-bold text-gray-900">Practice Tests</h1><p className="mt-2 text-gray-600">Choose a published quiz from the question bank.</p></div>
        {quizzes.length === 0 ? (
          <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Published practice tests are coming soon</h2>
            <p className="mt-2 max-w-2xl leading-6 text-gray-600">There are no reviewed, published quizzes available yet. Start learning with the original study guides and question bank while practice tests are prepared from verified questions with answer options.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/questions" className="rounded-lg bg-primary-600 px-4 py-2.5 font-semibold text-white hover:bg-primary-700">Open question bank</Link>
              <Link to="/study" className="rounded-lg border border-primary-200 px-4 py-2.5 font-semibold text-primary-700 hover:bg-primary-50">Study original guides</Link>
              <Link to="/flashcards" className="rounded-lg border border-gray-300 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50">Review flashcards</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {quizzes.map((item) => (
              <Link key={item._id} to={`/quizzes/${item._id}`} className="rounded-lg bg-white p-6 shadow transition hover:shadow-md">
                <h2 className="text-xl font-semibold text-gray-900">{item.title}</h2>
                <p className="mt-2 text-sm text-gray-600">{item.subject} · Semester {item.semester} · {item.questions.length} questions</p>
                <p className="mt-4 text-sm text-primary-700">Start quiz →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!quiz) return <div className="rounded-lg bg-white p-8 shadow">Quiz not found.</div>;
  if (result) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 text-center shadow">
        <h1 className="text-3xl font-bold text-gray-900">Quiz complete</h1>
        <p className="mt-4 text-5xl font-bold text-primary-700">{result.percentage}%</p>
        <p className="mt-2 text-gray-700">{result.score} / {result.totalMarks}</p>
        {result.correctAnswers !== undefined && result.totalQuestions !== undefined && (
          <p className="mt-2 text-sm text-gray-600">Correct answers: {result.correctAnswers} of {result.totalQuestions}</p>
        )}
        <p className="mt-6 text-gray-600">{result.feedback}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/quiz-history" className="rounded border border-primary-700 px-4 py-2 font-semibold text-primary-700">View all attempts</Link>
          <Link to="/quizzes" className="rounded bg-primary-600 px-4 py-2 font-semibold text-white">Back to quizzes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1><p className="mt-2 text-gray-600">{quiz.description} · {quiz.duration} minutes · {quiz.totalMarks} marks</p></div>
      {!attemptId ? (
        user ? <div className="rounded-lg bg-white p-8 text-center shadow"><button type="button" onClick={startQuiz} disabled={working} className="rounded bg-primary-600 px-6 py-3 font-semibold text-white disabled:opacity-50">{working ? 'Starting…' : 'Start Quiz'}</button></div>
          : <div className="rounded-lg bg-white p-8 text-center shadow"><h2 className="text-xl font-semibold text-gray-900">Ready to test yourself?</h2><p className="mt-2 text-gray-600">Sign in to start this quiz and save your result.</p><Link to="/login" state={{ from: `/quizzes/${quiz._id}` }} className="mt-4 inline-block rounded bg-primary-600 px-5 py-2.5 font-semibold text-white">Sign in to start</Link></div>
      ) : (
        <div className="space-y-4">
          {quiz.questions.map((entry, index) => {
            const question = populatedQuestion(entry);
            if (!question) return null;
            return (
              <div key={question._id} className="rounded-lg bg-white p-6 shadow">
                <p className="font-semibold text-gray-900">{index + 1}. {question.questionText}</p>
                <div className="mt-4 space-y-2">
                  {(question.options || []).map((option) => (
                    <label key={option.label} className="flex cursor-pointer gap-3 rounded border p-3 hover:bg-gray-50">
                      <input type="radio" name={question._id} value={option.label} checked={answers[question._id] === option.label} onChange={(event) => setAnswers((current) => ({ ...current, [question._id]: event.target.value }))} />
                      <span>{option.label}. {option.text}</span>
                    </label>
                  ))}
                  {(!question.options || question.options.length === 0) && <p className="text-sm text-gray-500">This quiz question has no selectable options.</p>}
                </div>
              </div>
            );
          })}
          <button type="button" onClick={submitQuiz} disabled={working} className="rounded bg-green-600 px-6 py-3 font-semibold text-white disabled:opacity-50">{working ? 'Submitting…' : 'Submit Quiz'}</button>
        </div>
      )}
    </div>
  );
}
