import { Loader } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  );
}

export function PageLoader() {
  const { t } = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-gray-600">{t('loading')}</p>
      </div>
    </div>
  );
}
