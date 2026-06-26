import React, { useState } from 'react';
import { getExpenseCategories, getIncomeCategories, getBanks } from './AddTransactionModal';
import { useTranslation } from '../utils/LanguageContext';

const Transactions = ({ transactions, settings, onDeleteTransaction, onEditClick, cards = [] }) => {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'income' | 'expense'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'

  const formatMoney = (amount) => {
    const symbol = t('currency_symbol');
    return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`;
  };

  const getCategoryDetails = (catId, type) => {
    const list = type === 'expense' ? getExpenseCategories(t) : getIncomeCategories(t);
    return list.find((c) => c.id === catId) || { name: t('cat_other_expense'), color: '#6B7280' };
  };

  const getBankDetails = (bankId) => {
    const customCard = cards.find(c => c.id === bankId);
    if (customCard) {
      return { name: `💳 ${customCard.name} (*${customCard.number.slice(-4)})`, color: '#8B5CF6' };
    }
    const list = getBanks(t);
    const foundDefault = list.find((b) => b.id === bankId);
    if (foundDefault) return foundDefault;

    return { name: t('cardNotFound'), color: '#EF4444' };
  };

  // Combine categories for filter selection
  const allCategories = [...getExpenseCategories(t), ...getIncomeCategories(t)];

  // Filtering logic
  const filteredTransactions = transactions.filter((tCode) => {
    const matchesType = typeFilter === 'all' || tCode.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || tCode.category === categoryFilter;
    const matchesSearch = (tCode.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          getCategoryDetails(tCode.category, tCode.type).name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  // Sorting logic
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  // Simulated export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert(t('noTransFilter'));
      return;
    }
    const headers = [t('thDate'), t('labelType'), t('thAmount'), t('modalCategory'), t('modalBank'), t('modalDesc')];
    const rows = transactions.map((tCode) => [
      tCode.date,
      tCode.type === 'income' ? t('modalIncome') : t('modalExpense'),
      tCode.amount,
      getCategoryDetails(tCode.category, tCode.type).name.split(' ').slice(1).join(' '),
      getBankDetails(tCode.bank).name.split(' ').slice(1).join(' '),
      tCode.description || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\ufeff' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CashFlow_UZ_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">{t('transTitle')}</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {t('transSubtitle')}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all duration-200 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
        >
          {t('exportBtn')}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
        {/* Search */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('searchPlaceholder')}</label>
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Type Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('labelType')}</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="all">{t('allCategories')}</option>
            <option value="income">📈 {t('incomesLabel')}</option>
            <option value="expense">📉 {t('expensesLabel')}</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('modalCategory')}</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="all">{t('allCategories')}</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Sorting */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('labelSort')}</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="date-desc">{t('sortNew')}</option>
            <option value="date-asc">{t('sortOld')}</option>
            <option value="amount-desc">{t('sortDesc')}</option>
            <option value="amount-asc">{t('sortAsc')}</option>
          </select>
        </div>
      </div>

      {/* Desktop / Tablet Table View (hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full border-collapse text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">{t('thDate')}</th>
              <th className="px-6 py-4">{t('thDesc')}</th>
              <th className="px-6 py-4">{t('thType')}</th>
              <th className="px-6 py-4">{t('thAmount')}</th>
              <th className="px-6 py-4 text-right">{t('thActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
            {sortedTransactions.map((tCode) => {
              const cat = getCategoryDetails(tCode.category, tCode.type);
              const bankDetails = getBankDetails(tCode.bank);
              const formattedDate = new Date(tCode.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });

              return (
                <tr key={tCode.id} className="hover:bg-slate-950/40 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-400">{formattedDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-base">{cat.name.split(' ')[0]}</span>
                      <div>
                        <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                          {tCode.description || cat.name.split(' ').slice(1).join(' ')}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 font-medium">{cat.name.split(' ').slice(1).join(' ')}</span>
                          {bankDetails.name && (
                            <span 
                              className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                              style={{ backgroundColor: `${bankDetails.color}15`, color: bankDetails.color }}
                            >
                              {bankDetails.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                      tCode.type === 'income' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {tCode.type === 'income' ? t('modalIncome') : t('modalExpense')}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-black ${tCode.type === 'income' ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {tCode.type === 'income' ? '+' : '-'} {formatMoney(tCode.amount)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => onEditClick(tCode)}
                      className="p-1.5 text-slate-500 hover:text-indigo-400 bg-transparent hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(tCode.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-500 bg-transparent hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-900/10">
            {t('noTransFilter')}
          </div>
        )}
      </div>

      {/* Mobile Card-based List View (hidden on desktop) */}
      <div className="block md:hidden space-y-3">
        {sortedTransactions.map((tCode) => {
          const cat = getCategoryDetails(tCode.category, tCode.type);
          const bankDetails = getBankDetails(tCode.bank);
          const formattedDate = new Date(tCode.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
          });

          return (
            <div 
              key={tCode.id} 
              className="p-4 bg-slate-950/40 hover:bg-slate-950/70 border border-slate-800/40 rounded-2xl transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  {cat.name.split(' ')[0]}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {tCode.description || cat.name.split(' ').slice(1).join(' ')}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {formattedDate} • {cat.name.split(' ').slice(1).join(' ')}
                    </span>
                    {bankDetails.name && (
                      <span 
                        className="px-1 py-0.2 rounded text-[7px] font-bold"
                        style={{ backgroundColor: `${bankDetails.color}15`, color: bankDetails.color }}
                      >
                        {bankDetails.name.split(' ')[0] === '💳' || bankDetails.name.split(' ')[0] === '💵'
                          ? bankDetails.name.split(' ').slice(1).join(' ')
                          : bankDetails.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-sm font-black ${tCode.type === 'income' ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {tCode.type === 'income' ? '+' : '-'} {formatMoney(tCode.amount)}
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditClick(tCode)}
                    className="p-1 text-slate-500 hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onDeleteTransaction(tCode.id)}
                    className="p-1 text-slate-500 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sortedTransactions.length === 0 && (
          <div className="text-center py-10 text-slate-500 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
            {t('noTransFilter')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
