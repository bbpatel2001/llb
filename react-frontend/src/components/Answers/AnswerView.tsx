import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Answer } from '@/types';
import { useLocale } from '@/context/LocaleContext';

function FormattedAnswer({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
        const first = lines[0] || '';
        const isHeading = lines.length === 1 && (
          /^#{1,4}\s/.test(first) ||
          /^\d+(?:\.\d+)*[.)]?\s+[^.!?]{2,100}$/.test(first) ||
          (/^[A-Z][A-Z\s:&()'’\-]{4,}$/.test(first) && first.length < 120)
        );
        if (isHeading) {
          return <h3 key={index} className="pt-2 text-base font-bold text-gray-900">{first.replace(/^#{1,4}\s+/, '')}</h3>;
        }
        return <p key={index} className="whitespace-pre-wrap leading-8 text-gray-700">{block.replace(/^#{1,4}\s+/, '')}</p>;
      })}
    </div>
  );
}

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
            {answer.reviewStatus === 'review_required' && <span className="px-2 py-1 rounded bg-amber-100 text-amber-900 text-xs font-semibold">Review Required</span>}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{answer.question}</h2>
        </div>
      </div>
      <div className="bg-gray-50 rounded-lg p-4"><FormattedAnswer text={answer.answer || ''} /></div>
      <div className="flex items-center gap-2 mt-4 text-sm text-green-700"><CheckCircle2 className="w-4 h-4" /><span>{t('studyAnswer')}</span></div>
    </article>
  );
}
