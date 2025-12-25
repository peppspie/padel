import { useTranslation } from 'react-i18next';

export function Navbar() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'it' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-gray-900 font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">{t('nav.brand')}</span>
          </div>
          <button 
            onClick={toggleLanguage}
            className="text-gray-300 hover:text-white text-sm font-medium px-3 py-1 rounded-md border border-gray-600 hover:border-gray-400 transition-colors"
          >
            {i18n.language.toUpperCase()}
          </button>
        </div>
      </div>
    </nav>
  );
}