import React from 'react';
import { useTranslation } from '../utils/LanguageContext';
import { playTick } from '../utils/sounds';

export const LanguageSwitcher = ({ className = '' }) => {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = (lang) => {
    if (language !== lang) {
      playTick();
      setLanguage(lang);
    }
  };

  return (
    <div className={`flex p-0.5 bg-slate-950/80 border border-slate-800/80 rounded-xl ${className}`}>
      <button
        type="button"
        onClick={() => toggleLanguage('ru')}
        className={`px-2 py-0.5 text-[9px] font-extrabold rounded-lg transition-all cursor-pointer ${
          language === 'ru'
            ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shadow-sm shadow-indigo-500/5'
            : 'text-slate-500 hover:text-slate-350 border border-transparent'
        }`}
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => toggleLanguage('uz')}
        className={`px-2 py-0.5 text-[9px] font-extrabold rounded-lg transition-all cursor-pointer ${
          language === 'uz'
            ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 shadow-sm shadow-indigo-500/5'
            : 'text-slate-500 hover:text-slate-350 border border-transparent'
        }`}
      >
        UZ
      </button>
    </div>
  );
};
export default LanguageSwitcher;
