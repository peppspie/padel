import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function TournamentView() {
  const { id } = useParams();
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">{t('app.dashboard')} {id}</h2>
      <p className="text-gray-400">{t('app.placeholderDashboard')}</p>
    </div>
  );
}