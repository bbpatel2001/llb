import { Answer } from '@/types';
import { AnswerView } from './AnswerView';
import { EmptyState } from '../Common';

interface AnswerListProps {
  answers: Answer[];
}

export function AnswerList({ answers }: AnswerListProps) {
  if (answers.length === 0) {
    return <EmptyState message="No answers found" />;
  }

  return (
    <div className="space-y-6">
      {answers.map((answer) => (
        <AnswerView key={answer._id} answer={answer} />
      ))}
    </div>
  );
}
