import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Answer } from '@/types';
import { useLocale } from '@/context/LocaleContext';

interface AnswerViewProps {
  answer: Answer;
}

export function AnswerView({ answer }: AnswerViewProps) {
  const { t } = useLocale();

  return (
    <article className="bg-white rounded-lg shadow p-6 border-l-4 border-primary-600">
      <div className="flex items-start gap-3 mb-4">
        <BookOpen className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-1 rounded bg-primary-50 text-primary-700 text-xs font-semibold uppercase">{answer.type.replace('_', ' ')}</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{answer.question}</h2>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 text-gray-700 leading-7 whitespace-pre-wrap">{answer.answer}</div>
      <div className="flex items-center gap-2 mt-4 text-sm text-green-700"><CheckCircle2 className="w-4 h-4" /><span>{t('studyAnswer')}</span></div>
    </article>
  );
}
