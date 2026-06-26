import React, { useState } from 'react';
import { getExpenseCategories, getIncomeCategories, getBanks } from './AddTransactionModal';
import { IncomeIcon, ExpenseIcon, WalletIcon } from './Icons';
import { useTranslation } from '../utils/LanguageContext';
import { parseBankSMS } from '../utils/smsParser';
import { playTick, playSuccess, playError } from '../utils/sounds';

const Dashboard = ({ transactions, settings, onAddClick, onDeleteTransaction, cards = [], onAddCard, onDeleteCard, onAddTransaction }) => {
  const { t } = useTranslation();
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState('humo'); // 'humo' | 'uzcard' | 'visa' | 'mastercard'
  const [cardNumber, setCardNumber] = useState('');
  const [cardBalance, setCardBalance] = useState('');

  // 3D Tilt handlers for cards and stats
  const handleMouseMove3D = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = -(y - yc) / 10;
    const angleY = (x - xc) / 10;
    
    el.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.015, 1.015, 1.015)`;
  };

  const handleMouseLeave3D = (e) => {
    const el = e.currentTarget;
    el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    el.style.boxShadow = '';
  };
  
  const [smsText, setSmsText] = useState('');
  const [smsFeedback, setSmsFeedback] = useState({ text: '', isError: false });

  // Format currency
  const formatMoney = (amount) => {
    const symbol = t('currency_symbol');
    return `${amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`;
  };

  // Card Number mask formatter (xxxx xxxx xxxx xxxx)
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    
    // Group by 4
    let grouped = '';
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) grouped += ' ';
      grouped += val[i];
    }
    setCardNumber(grouped);
    playTick();
  };

  // Submit new card
  const handleCardSubmit = (e) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 16) {
      alert(t('authErrPhone'));
      playError();
      return;
    }
    if (!cardName.trim()) {
      alert(t('authErrName'));
      playError();
      return;
    }

    const initialVal = parseFloat(cardBalance) || 0;
    
    onAddCard({
      id: 'card-' + Date.now(),
      name: cardName.trim(),
      type: cardType,
      number: cleanNum,
      initialBalance: initialVal
    });

    // Reset
    setCardName('');
    setCardNumber('');
    setCardBalance('');
    setShowCardForm(false);
    playSuccess();
  };

  // Calculate dynamic card balance
  const getCardBalance = (card) => {
    const cardTransactions = transactions.filter(tCode => tCode.bank === card.id);
    const incomes = cardTransactions.filter(tCode => tCode.type === 'income').reduce((sum, tCode) => sum + tCode.amount, 0);
    const expenses = cardTransactions.filter(tCode => tCode.type === 'expense').reduce((sum, tCode) => sum + tCode.amount, 0);
    return card.initialBalance + incomes - expenses;
  };

  // Total balance = sum of all cards' current balances + other transactions (Cash and default bank channels)
  const nonCustomTransactions = transactions.filter(tCode => !cards.some(c => c.id === tCode.bank));
  const otherIncomes = nonCustomTransactions.filter(tCode => tCode.type === 'income').reduce((sum, tCode) => sum + tCode.amount, 0);
  const otherExpenses = nonCustomTransactions.filter(tCode => tCode.type === 'expense').reduce((sum, tCode) => sum + tCode.amount, 0);
  const otherBalance = otherIncomes - otherExpenses;

  const totalBalance = cards.reduce((sum, c) => sum + getCardBalance(c), 0) + otherBalance;

  // Monthly budget limit calculations
  const monthlyExpense = transactions
    .filter((tCode) => {
      if (tCode.type !== 'expense') return false;
      const tDate = new Date(tCode.date);
      const now = new Date();
      return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, tCode) => sum + tCode.amount, 0);

  const limitPercentage = settings.monthlyLimit > 0 
    ? Math.min((monthlyExpense / settings.monthlyLimit) * 100, 100) 
    : 0;

  // SMS Parser submit
  const handleSmsImport = (e) => {
    e.preventDefault();
    setSmsFeedback({ text: '', isError: false });

    if (!smsText.trim()) return;

    const parsed = parseBankSMS(smsText);
    if (parsed) {
      // Find matching card by last 4 digits if SMS has a card reference like *1234
      const cardMaskRegex = /\*(\d{4})/;
      const maskMatch = smsText.match(cardMaskRegex);
      if (maskMatch && maskMatch[1] && cards.length > 0) {
        const matchingCard = cards.find(c => c.number.endsWith(maskMatch[1]));
        if (matchingCard) {
          parsed.bank = matchingCard.id;
        }
      } else if (cards.length > 0) {
        // Default to first card if user has cards
        parsed.bank = cards[0].id;
      }

      onAddTransaction(parsed);
      setSmsText('');
      setSmsFeedback({ text: t('smsSuccess'), isError: false });
      playSuccess();
      setTimeout(() => setSmsFeedback({ text: '', isError: false }), 4000);
    } else {
      setSmsFeedback({ text: t('smsError'), isError: true });
      playError();
    }
  };

  // Group expenses by category
  const expenseByCategory = transactions
    .filter((tCode) => tCode.type === 'expense')
    .reduce((acc, tCode) => {
      acc[tCode.category] = (acc[tCode.category] || 0) + tCode.amount;
      return acc;
    }, {});

  const totalIncome = transactions
    .filter((tCode) => tCode.type === 'income')
    .reduce((sum, tCode) => sum + tCode.amount, 0);

  const totalExpense = transactions
    .filter((tCode) => tCode.type === 'expense')
    .reduce((sum, tCode) => sum + tCode.amount, 0);

  const categoryStats = getExpenseCategories(t).map((cat) => {
    const amount = expenseByCategory[cat.id] || 0;
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    return { ...cat, amount, percentage };
  })
    .filter((cat) => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Generate data for the weekly SVG chart
  const getChartData = () => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    return days.map((dateStr) => {
      const dayTransactions = transactions.filter((tCode) => tCode.date === dateStr);
      const inc = dayTransactions.filter((tCode) => tCode.type === 'income').reduce((sum, tCode) => sum + tCode.amount, 0);
      const exp = dayTransactions.filter((tCode) => tCode.type === 'expense').reduce((sum, tCode) => sum + tCode.amount, 0);
      
      const dateObj = new Date(dateStr);
      const label = dateObj.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric' });
      return { label, income: inc, expense: exp };
    });
  };

  const chartData = getChartData();
  const maxVal = Math.max(...chartData.flatMap((d) => [d.income, d.expense]), 100000);

  const chartWidth = 500;
  const chartHeight = 160;
  const padding = 30;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  const generatePoints = (key) => {
    return chartData.map((d, index) => {
      const x = padding + (index * graphWidth) / (chartData.length - 1);
      const y = padding + graphHeight - (d[key] / maxVal) * graphHeight;
      return `${x},${y}`;
    }).join(' ');
  };

  const incomePoints = generatePoints('income');
  const expensePoints = generatePoints('expense');

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

  // Card background gradients mapping
  const getCardGradient = (index) => {
    const gradients = [
      'from-indigo-650 via-indigo-700 to-purple-650',
      'from-teal-600 via-emerald-700 to-cyan-600',
      'from-orange-550 via-pink-600 to-rose-600',
      'from-slate-750 via-slate-800 to-slate-950'
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {t('welcome')}, {settings.userName || 'User'}! 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t('overviewText')}
          </p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <button
            onClick={() => { playTick(); setShowCardForm(!showCardForm); }}
            className="flex-1 md:flex-none px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            💳 {t('cardAdd')}
          </button>
          <button
            onClick={onAddClick}
            className="flex-1 md:flex-none px-5 py-3 bg-gradient-to-r from-indigo-500 via-purple-550 to-pink-500 hover:from-indigo-650 hover:to-pink-650 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>➕</span> {t('newTransaction')}
          </button>
        </div>
      </div>

      {/* Card Form Widget (Slide down) */}
      {showCardForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-lg">
          <h3 className="text-sm font-bold text-white mb-4">💳 {t('cardAdd')}</h3>
          <form onSubmit={handleCardSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('cardName')}</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => { playTick(); setCardName(e.target.value); }}
                  placeholder="Humo Kapitalbank"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              {/* Card Type */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Тип карты</label>
                <select
                  value={cardType}
                  onChange={(e) => { playTick(); setCardType(e.target.value); }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="humo">Humo</option>
                  <option value="uzcard">Uzcard</option>
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('cardNumber')}</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="9860 1234 5678 9012"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                />
              </div>

              {/* Initial Balance */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('cardBalance')}</label>
                <input
                  type="number"
                  value={cardBalance}
                  onChange={(e) => { playTick(); setCardBalance(e.target.value); }}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 transition-all font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { playTick(); setShowCardForm(false); }}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all border border-slate-700/60"
              >
                {t('modalCancel')}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-650 rounded-xl shadow-md shadow-indigo-500/20 transition-all"
              >
                {t('cardAdd')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Credit Cards Horizontal Scroll */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
          {t('cardManager')}
        </h3>
        
        {cards.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {cards.map((card, idx) => {
              const balance = getCardBalance(card);
              return (
                <div 
                  key={card.id} 
                  onMouseMove={handleMouseMove3D}
                  onMouseLeave={handleMouseLeave3D}
                  className={`flex-shrink-0 w-72 aspect-[1.586/1] bg-gradient-to-tr ${getCardGradient(idx)} rounded-2xl p-5 text-white flex flex-col justify-between shadow-xl relative overflow-hidden border border-white/10 group card-3d-container card-3d-element cursor-pointer transition-transform duration-150 ease-out`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 card-3d-depth-flat"></div>
                  
                  {/* Card brand & Delete */}
                  <div className="flex justify-between items-start z-10 card-3d-depth">
                    <div>
                      <h4 className="text-xs font-extrabold tracking-wide uppercase">{card.name}</h4>
                      <span className="text-[8px] text-white/60 font-bold uppercase tracking-widest">{card.type} card</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(t('deleteConfirm'))) {
                          onDeleteCard(card.id);
                        }
                      }}
                      className="p-1 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-white/50 text-[10px] opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Удалить карту"
                    >
                      ✕
                    </button>
                  </div>
 
                  {/* EMV Chip Graphic representation */}
                  <div className="w-9 h-7 bg-amber-400/80 rounded-md border border-amber-500/40 relative z-10 flex p-1 overflow-hidden shadow-inner card-3d-depth">
                    <div className="w-full h-full border border-amber-600/30 rounded-sm grid grid-cols-3 gap-0.5">
                      <div className="border-r border-b border-amber-600/20"></div>
                      <div className="border-r border-b border-amber-600/20"></div>
                      <div className="border-b border-amber-600/20"></div>
                      <div className="border-r border-amber-600/20"></div>
                      <div className="border-r border-amber-600/20"></div>
                      <div></div>
                    </div>
                  </div>
 
                  {/* Card number & balance */}
                  <div className="z-10 card-3d-depth-high">
                    <span className="text-sm font-mono tracking-wider block text-white/80">
                      •••• •••• •••• {card.number.slice(-4)}
                    </span>
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <span className="text-[7px] uppercase tracking-wider text-white/50 font-bold">Баланс</span>
                        <h4 className="text-lg font-black tracking-tight">{formatMoney(balance)}</h4>
                      </div>
                      <div className="text-right text-[10px] font-black tracking-widest text-white/70">
                        {card.type.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-slate-900/50 border border-dashed border-slate-800 rounded-3xl text-center max-w-lg">
            <span className="text-3xl mb-2 block">💳</span>
            <h4 className="text-xs font-bold text-slate-300">{t('cardManager')}</h4>
            <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
              {t('addFirstTrans')}
            </p>
            <button
              onClick={() => { playTick(); setShowCardForm(true); }}
              className="mt-3 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
            >
              ➕ {t('cardAdd')}
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onMouseMove={handleMouseMove3D}
          onMouseLeave={handleMouseLeave3D}
          className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl card-3d-container card-3d-element cursor-pointer transition-transform duration-150 ease-out glow-indigo"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6 card-3d-depth"></div>
          <div className="flex items-center justify-between card-3d-depth">
            <span className="text-slate-400 text-sm font-semibold tracking-wide">{t('totalBalance')}</span>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <WalletIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 card-3d-depth-high">
            <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${totalBalance >= 0 ? 'text-white' : 'text-rose-500'}`}>
              {formatMoney(totalBalance)}
            </h3>
            <span className="text-xs text-slate-500 mt-2 block">{t('availableFunds')}</span>
          </div>
        </div>
 
        <div 
          onMouseMove={handleMouseMove3D}
          onMouseLeave={handleMouseLeave3D}
          className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl card-3d-container card-3d-element cursor-pointer transition-transform duration-150 ease-out glow-emerald"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 card-3d-depth"></div>
          <div className="flex items-center justify-between card-3d-depth">
            <span className="text-slate-400 text-sm font-semibold tracking-wide">{t('incomesLabel')}</span>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <IncomeIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 card-3d-depth-high">
            <h3 className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
              {formatMoney(totalIncome)}
            </h3>
            <span className="text-xs text-emerald-500/70 font-semibold mt-2 block">{t('incomesTrend')}</span>
          </div>
        </div>
 
        <div 
          onMouseMove={handleMouseMove3D}
          onMouseLeave={handleMouseLeave3D}
          className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl card-3d-container card-3d-element cursor-pointer transition-transform duration-150 ease-out glow-rose"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-6 -mt-6 card-3d-depth"></div>
          <div className="flex items-center justify-between card-3d-depth">
            <span className="text-slate-400 text-sm font-semibold tracking-wide">{t('expensesLabel')}</span>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
              <ExpenseIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 card-3d-depth-high">
            <h3 className="text-2xl md:text-3xl font-black text-rose-500 tracking-tight">
              {formatMoney(totalExpense)}
            </h3>
            <span className="text-xs text-rose-400/70 font-semibold mt-2 block">{t('expensesTrend')}</span>
          </div>
        </div>
      </div>

      {/* SMS Parser Box & Limit progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SMS Parser Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">{t('smsParser')}</h3>
            <p className="text-slate-400 text-xs mt-0.5">Получили SMS от Humo/Uzcard? Вставьте текст ниже для быстрого импорта.</p>
          </div>

          <form onSubmit={handleSmsImport} className="space-y-3">
            {smsFeedback.text && (
              <div className={`p-3 text-xs font-bold rounded-xl border ${
                smsFeedback.isError 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-455' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450'
              }`}>
                {smsFeedback.text}
              </div>
            )}
            <textarea
              rows="3"
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder={t('smsPlaceholder')}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
            ></textarea>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              📥 {t('smsParseBtn')}
            </button>
          </form>
        </div>

        {/* Limit & Budget progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">{t('monthlyLimit')}</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                {t('monthlyLimit')}: {settings.monthlyLimit > 0 ? formatMoney(settings.monthlyLimit) : t('limitNotSet')}
              </p>
            </div>

            {settings.monthlyLimit > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-400">{t('monthlySpent')}</span>
                  <span className={limitPercentage >= 90 ? 'text-rose-500 font-bold' : limitPercentage >= 70 ? 'text-amber-500 font-bold' : 'text-indigo-400 font-bold'}>
                    {formatMoney(monthlyExpense)} ({limitPercentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                  <div
                    style={{ width: `${limitPercentage}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      limitPercentage >= 90 
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-md shadow-rose-500/30' 
                        : limitPercentage >= 75 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-md shadow-amber-500/30' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-650 shadow-md shadow-indigo-500/30'
                    }`}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500">
                  {limitPercentage >= 100 
                    ? t('limitExceeded') 
                    : `${t('limitRemaining')} ${formatMoney(Math.max(settings.monthlyLimit - monthlyExpense, 0))}`}
                </p>
              </div>
            ) : (
              <div className="py-4 px-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center text-center">
                <span className="text-slate-500 text-2xl mb-1">🎯</span>
                <p className="text-slate-400 text-xs font-medium">{t('limitNotSet')}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t('limitSetHelp')}</p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-800/60 pt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              {t('topCategories')}
            </h4>
            
            {categoryStats.length > 0 ? (
              <div className="space-y-3 max-h-[120px] overflow-y-auto pr-1">
                {categoryStats.slice(0, 3).map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="text-slate-300">{cat.name}</span>
                      <span className="text-slate-400 font-bold">{formatMoney(cat.amount)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                        className="h-full rounded-full"
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                {t('noExpenses')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic 7-day SVG Chart & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">{t('chartTitle')}</h3>
              <p className="text-slate-400 text-xs mt-0.5">{t('chartSubtitle')}</p>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> {t('incomesLabel')}
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> {t('expensesLabel')}
              </div>
            </div>
          </div>

          <div className="relative w-full aspect-[5/2] md:aspect-[3/1] bg-slate-950/40 rounded-2xl p-2 border border-slate-900/60 overflow-hidden">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = padding + ratio * graphHeight;
                return (
                  <line key={idx} x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#1E293B" strokeWidth="1" strokeDasharray="4 4" />
                );
              })}

              {totalIncome > 0 && (
                <>
                  <polyline fill="none" stroke="#10B981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={incomePoints} />
                  {chartData.map((d, idx) => {
                    const x = padding + (idx * graphWidth) / (chartData.length - 1);
                    const y = padding + graphHeight - (d.income / maxVal) * graphHeight;
                    return (
                      <circle key={idx} cx={x} cy={y} r="4" fill="#10B981" stroke="#0B0F19" strokeWidth="2" />
                    );
                  })}
                </>
              )}

              {totalExpense > 0 && (
                <>
                  <polyline fill="none" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points={expensePoints} />
                  {chartData.map((d, idx) => {
                    const x = padding + (idx * graphWidth) / (chartData.length - 1);
                    const y = padding + graphHeight - (d.expense / maxVal) * graphHeight;
                    return (
                      <circle key={idx} cx={x} cy={y} r="4" fill="#EF4444" stroke="#0B0F19" strokeWidth="2" />
                    );
                  })}
                </>
              )}

              {chartData.map((d, idx) => {
                const x = padding + (idx * graphWidth) / (chartData.length - 1);
                return (
                  <text key={idx} x={x} y={chartHeight - 8} fill="#64748B" fontSize="9" fontWeight="600" textAnchor="middle">{d.label}</text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white tracking-wide">{t('recentTransactions')}</h3>
            <p className="text-slate-400 text-xs mt-0.5">{t('recentSubtitle')}</p>
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {transactions.slice(0, 4).map((tCode) => {
                const cat = getCategoryDetails(tCode.category, tCode.type);
                const bankDetails = getBankDetails(tCode.bank);
                const formattedDate = new Date(tCode.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short'
                });

                return (
                  <div key={tCode.id} className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-850/60 rounded-xl hover:bg-slate-950/70 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                        {cat.name.split(' ')[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{tCode.description || cat.name.split(' ').slice(1).join(' ')}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-slate-500 font-medium">{formattedDate}</span>
                          {bankDetails.name && (
                            <span className="px-1 text-[7px] rounded text-slate-400 font-bold" style={{ backgroundColor: `${bankDetails.color}10` }}>
                              {bankDetails.name.split(' ')[0] === '💳' || bankDetails.name.split(' ')[0] === '💵' ? bankDetails.name.split(' ').slice(1).join(' ') : bankDetails.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-black shrink-0 ${tCode.type === 'income' ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {tCode.type === 'income' ? '+' : '-'} {formatMoney(tCode.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl">
              <p className="text-xs">{t('noTransactions')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
