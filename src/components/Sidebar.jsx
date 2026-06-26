import React from 'react';
import { 
  DashboardIcon, 
  IncomeIcon, 
  ExpenseIcon, 
  TransactionsIcon, 
  SettingsIcon 
} from './Icons';
import { useTranslation } from '../utils/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from '../assets/logo-CASHFLOW.jpg';

const Sidebar = ({ activeTab, setActiveTab, settings, onAddClick, onLogout }) => {
  const { t } = useTranslation();

  const menuItems = [
    { id: 'dashboard', label: `${t('tabDashboard')}`, icon: DashboardIcon, color: 'text-indigo-400' },
    { id: 'incomes', label: `${t('tabIncomes')}`, icon: IncomeIcon, color: 'text-emerald-400' },
    { id: 'expenses', label: `${t('tabExpenses')}`, icon: ExpenseIcon, color: 'text-rose-400' },
    { id: 'transactions', label: `${t('tabTransactions')}`, icon: TransactionsIcon, color: 'text-indigo-400' },
    { id: 'settings', label: `${t('tabSettings')}`, icon: SettingsIcon, color: 'text-slate-400' }
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white min-h-screen sticky top-0 z-30">
      {/* Brand logo section */}
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="CashFlow Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-800 shadow-md" />
          <div>
            <h2 className="text-sm font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-350">
              {t('brandTitle')}
            </h2>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
              {t('brandSubtitle')}
            </span>
          </div>
        </div>
      </div>

      {/* Language Switcher on top of profile card */}
      <div className="px-4 mt-4 flex justify-end">
        <LanguageSwitcher />
      </div>

      {/* User profile widget */}
      <div className="mx-4 mt-3 p-4 bg-slate-950/50 border border-slate-850 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-extrabold text-indigo-400 text-sm">
          {settings.userName ? settings.userName.substring(0, 2).toUpperCase() : 'US'}
        </div>
        <div className="overflow-hidden">
          <h4 className="text-xs font-bold text-white truncate">{settings.userName || 'User'}</h4>
          <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            {t('statusActive')}
          </span>
        </div>
      </div>

      {/* Quick Add Button */}
      <div className="px-4 mt-6">
        <button
          onClick={onAddClick}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-650 hover:to-pink-600 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>➕</span> {t('newTransaction')}
        </button>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 mt-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-650/15 text-indigo-400 border-l-4 border-indigo-500 pl-3.5'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Log Out button for desktop */}
        <button
          onClick={() => {
            if (window.confirm(t('logoutConfirm'))) {
              onLogout();
            }
          }}
          className="w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold text-slate-500 hover:text-rose-450 hover:bg-rose-500/5 rounded-xl transition-all duration-200 mt-4 border-t border-slate-800/40 pt-4 cursor-pointer"
        >
          <span>🚪</span>
          <span>{t('logoutBtn')}</span>
        </button>
      </nav>

      {/* Bottom info section */}
      <div className="p-4 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-medium">
        {t('brandTitle')} • 2026
      </div>
    </aside>
  );
};

export default Sidebar;
