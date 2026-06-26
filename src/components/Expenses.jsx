import React, { useState } from 'react';
import { getExpenseCategories } from './AddTransactionModal';
import { useTranslation } from '../utils/LanguageContext';

const Expenses = ({ transactions, settings, onAddClick, onDeleteTransaction }) => {
  const { t } = useTranslation();
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const formatMoney = (amount) => {
    const symbol = t('currency_symbol');
    return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`;
  };

  const expenses = transactions.filter((t) => t.type === 'expense');

  // Calculate statistics
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;
  const maxExpense = expenses.length > 0 ? Math.max(...expenses.map((t) => t.amount)) : 0;

  // Filter expenses
  const expenseCategories = getExpenseCategories(t);
  const filteredExpenses = expenses.filter((tCode) => {
    const matchesCategory = filterCategory === 'all' || tCode.category === filterCategory;
    const matchesSearch = (tCode.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate category percentages
  const expenseByCategory = expenses.reduce((acc, tCode) => {
    acc[tCode.category] = (acc[tCode.category] || 0) + tCode.amount;
    return acc;
  }, {});

  const categoryBreakdown = expenseCategories.map((cat) => {
    const amount = expenseByCategory[cat.id] || 0;
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    return { ...cat, amount, percentage };
  })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const getCategoryDetails = (catId) => {
    return expenseCategories.find((c) => c.id === catId) || { name: t('cat_other_expense'), color: '#6B7280' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{t('expTitle')}</h1>
          <p className="text-slate-400 text-sm mt-1">
            {t('expSubtitle')}
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="w-full md:w-auto px-5 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>➕</span> {t('newTransaction')}
        </button>
      </div>

      {/* Analytics grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-2xl"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('statTotal')}</span>
          <h3 className="text-2xl font-black text-rose-500 mt-2">{formatMoney(totalExpense)}</h3>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 rounded-full blur-2xl"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('statAvg')}</span>
          <h3 className="text-2xl font-black text-white mt-2">{formatMoney(averageExpense)}</h3>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{t('statMax')}</span>
          <h3 className="text-2xl font-black text-white mt-2">{formatMoney(maxExpense)}</h3>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Filterable Transaction List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-white tracking-wide">{t('historyLabel')}</h3>
          
          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all">{t('allCategories')}</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Table list */}
          {filteredExpenses.length > 0 ? (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {filteredExpenses.map((tCode) => {
                const cat = getCategoryDetails(tCode.category);
                const formattedDate = new Date(tCode.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={tCode.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950/40 hover:bg-slate-950/85 border border-slate-800/40 rounded-2xl transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                      >
                        {cat.name.split(' ')[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">
                          {tCode.description || cat.name.split(' ').slice(1).join(' ')}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {formattedDate} • {cat.name.split(' ').slice(1).join(' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-rose-500">
                        -{formatMoney(tCode.amount)}
                      </span>
                      <button
                        onClick={() => onDeleteTransaction(tCode.id)}
                        className="p-1.5 text-slate-655 hover:text-rose-500 bg-transparent hover:bg-rose-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
              <span className="text-2xl mb-1.5 block">📭</span>
              <p className="text-xs font-semibold">{t('noDataTitle')}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{t('noDataSubtitle')}</p>
            </div>
          )}
        </div>

        {/* Right Side: Category Breakdown Progress Bars */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <h3 className="text-lg font-bold text-white tracking-wide mb-1">{t('breakdownTitle')}</h3>
          <p className="text-slate-400 text-xs mb-4">{t('breakdownSubtitle')}</p>

          {categoryBreakdown.length > 0 ? (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {categoryBreakdown.map((cat) => (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-300">{cat.name}</span>
                    <span className="text-rose-400 font-bold">
                      {formatMoney(cat.amount)} ({cat.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-900">
                    <div
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      className="h-full rounded-full shadow-sm shadow-rose-500/20"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-6">
              <span className="text-3xl mb-2">📊</span>
              <p className="text-xs font-medium">Нет данных для анализа</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
