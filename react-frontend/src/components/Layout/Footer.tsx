import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-primary-500" />
              <span className="font-bold text-white">LLB Platform</span>
            </div>
            <p className="text-sm text-gray-400">{t('masterLawStudies')}</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t('quickLinks')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition">{t('home')}</Link></li>
              <li><Link to="/papers" className="hover:text-primary-400 transition">{t('papers')}</Link></li>
              <li><Link to="/study" className="hover:text-primary-400 transition">{t('study')}</Link></li>
              <li><Link to="/flashcards" className="hover:text-primary-400 transition">{t('flashcards')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t('resources')}</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-400 transition">{t('about')}</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">{t('contact')}</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">{t('privacy')}</a></li>
              <li><a href="#" className="hover:text-primary-400 transition">{t('terms')}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">{t('follow')}</h4>
            <div className="flex gap-4 text-sm">
              <a href="#" className="hover:text-primary-400 transition">Twitter</a>
              <a href="#" className="hover:text-primary-400 transition">LinkedIn</a>
              <a href="#" className="hover:text-primary-400 transition">GitHub</a>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-sm text-gray-400">
            © 2026 LLB Platform. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}
