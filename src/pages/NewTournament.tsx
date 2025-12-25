import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NewTournament() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-400 hover:text-white mr-4"
        >
          &larr; {t('app.back')}
        </button>
        <h2 className="text-2xl font-bold text-white">{t('app.configure')}</h2>
      </div>
      <p className="text-gray-400">{t('app.placeholderConfig')}</p>
    </div>
  );
}