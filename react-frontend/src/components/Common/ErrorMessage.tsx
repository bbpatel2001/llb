import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const { t } = useLocale();
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
      <p className="font-medium text-red-800">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
          <RefreshCw className="h-4 w-4" /> {t('tryAgain')}
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
      <Inbox className="mx-auto mb-3 h-10 w-10 text-gray-400" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
