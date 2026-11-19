import { Link } from 'react-router-dom';
import { Question } from '@/types';
import { useLocale } from '@/context/LocaleContext';
import { formatMarks } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const { locale, t } = useLocale();
  const displayedQuestion = locale === 'gu' && question.questionTextGu ? question.questionTextGu : question.questionText;

  return (
    <Link to={`/questions/${question._id}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer">
        <p className="text-gray-900 font-medium mb-2">{displayedQuestion}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{question.subject}</span>
          <span>{question.type}</span>
          {question.marks && <span>{formatMarks(question.marks)} {t('marks')}</span>}
        </div>
      </div>
    </Link>
  );
}
