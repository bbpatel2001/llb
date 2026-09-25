import { Question } from '@/types';
import { useLocale } from '@/context/LocaleContext';
import { QuestionCard } from './QuestionCard';

interface QuestionListProps {
  questions: Question[];
}

export function QuestionList({ questions }: QuestionListProps) {
  const { t } = useLocale();

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{t('noQuestionsFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <QuestionCard key={question._id} question={question} />
      ))}
    </div>
  );
}
