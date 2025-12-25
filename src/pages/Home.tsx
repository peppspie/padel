import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-6 text-center">
        {t('app.title')}
      </h1>
      <p className="text-gray-400 text-center mb-10 text-lg">
        {t('app.subtitle')}
      </p>
      
      <div className="w-full space-y-4">
        <button 
          onClick={() => navigate('/new')}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <span>🏆</span> {t('app.newTournament')}
        </button>
        
        <button className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-4 px-6 rounded-xl border border-gray-700 shadow-md transform transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
          <span>📂</span> {t('app.loadTournament')}
        </button>
      </div>
    </div>
  );
}