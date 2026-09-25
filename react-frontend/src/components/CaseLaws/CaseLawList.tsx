import { CaseLaw } from '@/types';
import { CaseLawCard } from './CaseLawCard';
import { EmptyState } from '../Common';

interface CaseLawListProps {
  caseLaws: CaseLaw[];
}

export function CaseLawList({ caseLaws }: CaseLawListProps) {
  if (caseLaws.length === 0) {
    return <EmptyState message="No case laws found" />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {caseLaws.map((caseLaw) => (
        <CaseLawCard key={caseLaw._id} caseLaw={caseLaw} />
      ))}
    </div>
  );
}
