import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';
import { useTranslation } from '../utils/LanguageContext';

const getExpenseCategories = (t) => [
  { id: 'food', name: t('cat_food'), color: '#EF4444' },
  { id: 'transport', name: t('cat_transport'), color: '#3B82F6' },
  { id: 'housing', name: t('cat_housing'), color: '#F59E0B' },
  { id: 'entertainment', name: t('cat_entertainment'), color: '#10B981' },
  { id: 'shopping', name: t('cat_shopping'), color: '#8B5CF6' },
  { id: 'health', name: t('cat_health'), color: '#EC4899' },
  { id: 'other_expense', name: t('cat_other_expense'), color: '#6B7280' }
];

const getIncomeCategories = (t) => [
  { id: 'salary', name: t('cat_salary'), color: '#10B981' },
  { id: 'freelance', name: t('cat_freelance'), color: '#3B82F6' },
  { id: 'investments', name: t('cat_investments'), color: '#8B5CF6' },
  { id: 'gifts', name: t('cat_gifts'), color: '#EC4899' },
  { id: 'other_income', name: t('cat_other_income'), color: '#6B7280' }
];

const getBanks = (t) => [
  { id: 'bank_humo', name: t('bank_humo'), color: '#3B82F6' },
  { id: 'bank_uzcard', name: t('bank_uzcard'), color: '#10B981' },
  { id: 'bank_tbc', name: t('bank_tbc'), color: '#8B5CF6' },
  { id: 'bank_anor', name: t('bank_anor'), color: '#EF4444' },
  { id: 'bank_kapital', name: t('bank_kapital'), color: '#06B6D4' },
  { id: 'bank_cash', name: t('bank_cash'), color: '#6B7280' }
];

const AddTransactionModal = ({ isOpen, onClose, onAdd, editTransaction = null, settings, cards = [] }) => {
  const { t } = useTranslation();
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [bank, setBank] = useState('bank_humo');

  const expenseCategories = getExpenseCategories(t);
  const incomeCategories = getIncomeCategories(t);
  
  // Combine custom cards with default banks list
  const customCardsList = cards.map(c => ({
    id: c.id,
    name: `💳 ${c.name} (*${c.number.slice(-4)})`,
    color: '#8B5CF6'
  }));
  const banksList = [...customCardsList, ...getBanks(t)];

  // Handle editing mode
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(Math.abs(editTransaction.amount).toString());
      setCategory(editTransaction.category);
      setDate(editTransaction.date);
      setDescription(editTransaction.description || '');
      setBank(editTransaction.bank || 'bank_humo');
    } else {
      setType('expense');
      setAmount('');
      setCategory('food');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setBank('bank_humo');
    }
  }, [editTransaction, isOpen]);

  // Adjust category when type changes
  useEffect(() => {
    if (!editTransaction) {
      if (type === 'expense') {
        setCategory('food');
      } else {
        setCategory('salary');
      }
    }
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert(t('modalErrAmount'));
      return;
    }

    const transactionData = {
      id: editTransaction ? editTransaction.id : Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category,
      date,
      description: description.trim(),
      bank
    };

    onAdd(transactionData);
    onClose();
  };

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const currencySymbol = t('currency_symbol');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative w-full max-w-md overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-indigo-500/10 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 transition-colors duration-500 ${type === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-10 -ml-10 -mb-10"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800/80 relative z-10">
          <h3 className="text-lg font-bold text-white tracking-wide">
            {editTransaction ? t('modalEditTrans') : t('modalNewTrans')}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all duration-200"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 relative z-10 max-h-[75vh] overflow-y-auto">
          {!editTransaction && (
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-850">
              <button
                type="button"
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                  type === 'expense'
                    ? 'bg-gradient-to-r from-rose-500 to-red-650 text-white shadow-lg shadow-rose-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setType('expense')}
              >
                {t('modalExpense')}
              </button>
              <button
                type="button"
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                  type === 'income'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-650 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setType('income')}
              >
                {t('modalIncome')}
              </button>
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('modalAmount')}</label>
            <div className="relative">
              <input
                type="number"
                step="100"
                min="100"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`w-full px-4 py-3 text-xl font-bold bg-slate-950 border rounded-2xl text-white placeholder-slate-650 focus:outline-none focus:ring-2 transition-all ${
                  type === 'expense' 
                    ? 'border-slate-800 focus:border-rose-500/50 focus:ring-rose-500/20' 
                    : 'border-slate-800 focus:border-emerald-500/50 focus:ring-emerald-500/20'
                }`}
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                {currencySymbol}
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('modalCategory')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-950">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bank / Card Selection (Uzbekistan Specific) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('modalBank')}</label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
            >
              {banksList.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-950">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('modalDate')}</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('modalDesc')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'expense' ? 'Korzinka, Oqtepa Lavash...' : 'Oylik o\'tkazmasi, Freelance...'}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-xl transition-all border border-slate-800/60"
            >
              {t('modalCancel')}
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all transform active:scale-[0.98] ${
                type === 'expense'
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/25'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
              }`}
            >
              {editTransaction ? t('modalSave') : t('modalAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
export { getExpenseCategories, getIncomeCategories, getBanks };
