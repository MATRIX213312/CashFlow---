import React, { useState, useEffect } from 'react';
import { useTranslation } from '../utils/LanguageContext';
import { playTick, playSuccess, playError } from '../utils/sounds';

const AdminPanel = ({ onLogout }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState({ cards: [], categories: {}, transactions: [], totalBalance: 0 });
  const [rawDbJson, setRawDbJson] = useState('');

  // Load all users from LocalStorage
  const loadUsersData = () => {
    const allUsers = JSON.parse(localStorage.getItem('cashflow_users') || '[]');
    setUsers(allUsers);
    
    // Create raw JSON view of the entire DB
    const rawDb = {
      users: allUsers,
      activeSession: JSON.parse(localStorage.getItem('cashflow_active_user') || 'null'),
      systemLogs: {
        lastBackup: new Date().toISOString(),
        environment: 'Production Client-Side',
        storageType: 'HTML5 LocalStorage'
      }
    };
    setRawDbJson(JSON.stringify(rawDb, null, 2));
  };

  useEffect(() => {
    loadUsersData();
  }, []);

  // Calculate statistics for each user
  const getUserFinancials = (userId) => {
    const userTrans = JSON.parse(localStorage.getItem(`cashflow_transactions_${userId}`) || '[]');
    const userCards = JSON.parse(localStorage.getItem(`cashflow_cards_${userId}`) || '[]');
    
    // Card balances
    const cardBalances = userCards.map(card => {
      const cardTrans = userTrans.filter(t => t.bank === card.id);
      const inc = cardTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const exp = cardTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return card.initialBalance + inc - exp;
    });

    const cardsTotal = cardBalances.reduce((sum, val) => sum + val, 0);

    // Cash balance
    const cashTrans = userTrans.filter(t => t.bank === 'bank_cash' || (!t.bank && t.bank !== 'bank_cash' && !userCards.some(c => c.id === t.bank)));
    const cashInc = cashTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const cashExp = cashTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const cashTotal = cashInc - cashExp;

    const totalBalance = cardsTotal + cashTotal;
    return {
      totalBalance,
      transactionsCount: userTrans.length,
      cardsCount: userCards.length
    };
  };

  // Inspect specific user detailed stats
  const handleSelectUser = (user) => {
    playTick();
    const userTrans = JSON.parse(localStorage.getItem(`cashflow_transactions_${user.id}`) || '[]');
    const userCards = JSON.parse(localStorage.getItem(`cashflow_cards_${user.id}`) || '[]');

    // Calculate category breakdown
    const categoryBreakdown = userTrans.reduce((acc, t) => {
      const typeLabel = t.type === 'income' ? 'incomes' : 'expenses';
      acc[typeLabel] = acc[typeLabel] || {};
      acc[typeLabel][t.category] = (acc[typeLabel][t.category] || 0) + t.amount;
      return acc;
    }, { incomes: {}, expenses: {} });

    // Calculate total balance
    const financials = getUserFinancials(user.id);

    setSelectedUser(user);
    setUserStats({
      cards: userCards,
      categories: categoryBreakdown,
      transactions: userTrans,
      totalBalance: financials.totalBalance
    });
  };

  // Delete User completely
  const handleDeleteUser = (userId, e) => {
    e.stopPropagation();
    if (window.confirm(t('adminDeleteConfirm'))) {
      const allUsers = JSON.parse(localStorage.getItem('cashflow_users') || '[]');
      const filtered = allUsers.filter(u => u.id !== userId);
      localStorage.setItem('cashflow_users', JSON.stringify(filtered));

      // Clean up user specific data
      localStorage.removeItem(`cashflow_transactions_${userId}`);
      localStorage.removeItem(`cashflow_settings_${userId}`);
      localStorage.removeItem(`cashflow_cards_${userId}`);

      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(null);
      }

      loadUsersData();
      playSuccess();
    }
  };

  // Format currency
  const formatMoney = (amount) => {
    return `${amount.toLocaleString('ru-RU')} so'm`;
  };

  // Calculate total system stats
  const totalUsers = users.length;
  const totalSystemTransactions = users.reduce((sum, u) => {
    const trans = JSON.parse(localStorage.getItem(`cashflow_transactions_${u.id}`) || '[]');
    return sum + trans.length;
  }, 0);
  const totalSystemBalance = users.reduce((sum, u) => {
    return sum + getUserFinancials(u.id).totalBalance;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Admin Title */}
      <div className="flex justify-between items-center bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            🛡️ {t('adminPanel')}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Контроль над базой данных пользователей и их финансовыми характеристиками.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
        >
          🚪 {t('logoutBtn')}
        </button>
      </div>

      {/* System KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('adminStatsUsers')}</span>
          <h3 className="text-2xl font-black text-white mt-2">{totalUsers}</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">{t('adminStatsTrans')}</span>
          <h3 className="text-2xl font-black text-indigo-400 mt-2">{totalSystemTransactions}</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Суммарный баланс</span>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">{formatMoney(totalSystemBalance)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users list table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white tracking-wide">{t('adminUsersList')}</h3>
          
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs text-slate-350">
              <thead className="bg-slate-950 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-850">
                <tr>
                  <th className="px-4 py-3">Пользователь</th>
                  <th className="px-4 py-3">Телефон</th>
                  <th className="px-4 py-3">Пароль</th>
                  <th className="px-4 py-3">Баланс</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {users.map(u => {
                  const fin = getUserFinancials(u.id);
                  const isSelected = selectedUser && selectedUser.id === u.id;
                  return (
                    <tr 
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`hover:bg-slate-900/60 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-500/10' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{u.phone}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{u.password}</td>
                      <td className="px-4 py-3 font-extrabold text-emerald-400">{formatMoney(fin.totalBalance)}</td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDeleteUser(u.id, e)}
                          className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                          title="Удалить пользователя"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-slate-500">
                      {t('adminNoUsers')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User stats details panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white tracking-wide">{t('adminDetailTitle')}</h3>
          
          {selectedUser ? (
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl">
                <h4 className="text-sm font-black text-white">{selectedUser.name}</h4>
                <p className="text-[10px] text-slate-500">{selectedUser.email}</p>
                <div className="mt-3 flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-450">Личный баланс:</span>
                  <span className="text-emerald-400 font-extrabold">{formatMoney(userStats.totalBalance)}</span>
                </div>
              </div>

              {/* Cards list */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Подключенные карты ({userStats.cards.length})</span>
                {userStats.cards.length > 0 ? (
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {userStats.cards.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-2 bg-slate-950/30 rounded-xl border border-slate-850/40 text-xs">
                        <span className="font-semibold text-slate-300">{c.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">*{c.number.slice(-4)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-550 italic">Нет привязанных карт</p>
                )}
              </div>

              {/* Expenses Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Характеристики расходов</span>
                {Object.keys(userStats.categories.expenses || {}).length > 0 ? (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {Object.entries(userStats.categories.expenses).map(([catId, amount]) => (
                      <div key={catId} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-medium text-slate-350">
                          <span>{catId}</span>
                          <span className="font-bold text-rose-400">{formatMoney(amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-550 italic">Нет зарегистрированных расходов</p>
                )}
              </div>

              {/* Incomes Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest">Характеристики доходов</span>
                {Object.keys(userStats.categories.incomes || {}).length > 0 ? (
                  <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                    {Object.entries(userStats.categories.incomes).map(([catId, amount]) => (
                      <div key={catId} className="space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-medium text-slate-350">
                          <span>{catId}</span>
                          <span className="font-bold text-emerald-400">{formatMoney(amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-550 italic">Нет зарегистрированных доходов</p>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 px-4 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500">
              <span className="text-2xl mb-1.5 block">👤</span>
              <p className="text-xs">Выберите пользователя из списка слева, чтобы посмотреть его детальные финансовые показатели.</p>
            </div>
          )}
        </div>
      </div>

      {/* Raw LocalStorage DB Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">{t('adminRawStorage')}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{t('adminRawDesc')}</p>
        </div>

        <pre className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] text-indigo-300 overflow-x-auto max-h-[250px] font-mono leading-relaxed select-all">
          {rawDbJson}
        </pre>
      </div>
    </div>
  );
};

export default AdminPanel;
