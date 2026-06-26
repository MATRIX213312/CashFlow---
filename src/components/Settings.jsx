import React, { useState } from 'react';
import { useTranslation } from '../utils/LanguageContext';

const Settings = ({ settings, onUpdateSettings, onResetData, onLoadSampleData, onLogout }) => {
  const { t, language } = useTranslation();
  const [userName, setUserName] = useState(settings.userName);
  const [currency, setCurrency] = useState('UZS');
  const [monthlyLimit, setMonthlyLimit] = useState(settings.monthlyLimit);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdateSettings({
      userName: userName.trim() || 'User',
      currency: 'UZS',
      monthlyLimit: parseFloat(monthlyLimit) || 0
    });
    setShowSavedMsg(true);
    setTimeout(() => setShowSavedMsg(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm(t('resetConfirm'))) {
      onResetData();
      alert(t('resetAlert'));
    }
  };

  const handleSampleData = () => {
    onLoadSampleData();
    alert(t('demoAlert'));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Settings Form Card */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">{t('settingsTitle')}</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {t('settingsSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('labelName')}</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Alex"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all font-semibold"
            />
          </div>

          {/* Currency selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('labelCurrency')}</label>
            <div className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-350 font-bold text-xs select-none">
              🇺🇿 {language === 'uz' ? "O'zbekiston so'mi (UZS)" : "Узбекский сум (UZS)"}
            </div>
          </div>

          {/* Monthly Budget Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('labelLimit')}</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all font-bold"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 select-none">
                {t('currency_symbol')}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4">
            {showSavedMsg && (
              <span className="text-xs font-bold text-emerald-400 animate-pulse">
                {t('savedSuccess')}
              </span>
            )}
            <div className="flex-1 text-right">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
              >
                {t('saveChangesBtn')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Developers & System Actions Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">{t('sysTitle')}</h3>
          <p className="text-slate-400 text-xs mt-0.5">{t('sysSubtitle')}</p>
        </div>

        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {/* Load Sample Data Button */}
          <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-indigo-400">{t('demoTitle')}</h4>
            <p className="text-[10px] text-slate-400">
              {t('demoDesc')}
            </p>
            <button
              onClick={handleSampleData}
              type="button"
              className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('demoBtn')}
            </button>
          </div>

          {/* Reset System Button */}
          <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-rose-400">{t('resetTitle')}</h4>
            <p className="text-[10px] text-slate-400">
              {t('resetDesc')}
            </p>
            <button
              onClick={handleReset}
              type="button"
              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('resetBtn')}
            </button>
          </div>

          {/* Session Logout Button */}
          <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-slate-400">{t('sessionTitle')}</h4>
            <p className="text-[10px] text-slate-500">
              {t('sessionDesc')}
            </p>
            <button
              onClick={() => {
                if (window.confirm(t('logoutConfirm'))) {
                  onLogout();
                }
              }}
              type="button"
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              {t('sessionBtn')}
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 text-center border-t border-slate-800/60 pt-4">
          CashFlow UZ v2.0.0 • {t('welcome')}
        </div>
      </div>
    </div>
  );
};

export default Settings;
