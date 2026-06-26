import React from 'react';
import { 
  DashboardIcon, 
  IncomeIcon, 
  ExpenseIcon, 
  SettingsIcon,
  PlusIcon
} from './Icons';
import { useTranslation } from '../utils/LanguageContext';

const BottomNav = ({ activeTab, setActiveTab, onAddClick }) => {
  const { t } = useTranslation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 pb-safe-offset">
      <div className="flex items-center justify-between relative max-w-lg mx-auto">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <DashboardIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">{t('tabDashboard')}</span>
        </button>

        {/* Incomes Tab */}
        <button
          onClick={() => setActiveTab('incomes')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'incomes' ? 'text-emerald-400 scale-110' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <IncomeIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">{t('tabIncomes')}</span>
        </button>

        {/* Center Floating Plus Action Button */}
        <div className="relative -mt-6">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-md opacity-35 scale-125 animate-pulse"></div>
          <button
            onClick={onAddClick}
            type="button"
            className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-655 hover:to-pink-655 text-white rounded-full shadow-lg shadow-indigo-550/40 active:scale-95 transition-all duration-300 z-10 cursor-pointer"
          >
            <PlusIcon className="w-6 h-6 stroke-white" />
          </button>
        </div>

        {/* Expenses Tab */}
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'expenses' ? 'text-rose-400 scale-110' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <ExpenseIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">{t('tabExpenses')}</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 cursor-pointer ${
            activeTab === 'settings' ? 'text-slate-350 scale-110' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-1">{t('tabSettings')}</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
