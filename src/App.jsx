import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import Incomes from './components/Incomes';
import Expenses from './components/Expenses';
import Transactions from './components/Transactions';
import Settings from './components/Settings';
import AddTransactionModal from './components/AddTransactionModal';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import { useTranslation } from './utils/LanguageContext';
import Logo from './assets/logo-CASHFLOW.jpg';

// Helper to generate dates relative to today (YYYY-MM-DD)
const getRelativeDateStr = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const DEFAULT_SETTINGS = {
  userName: 'Foydalanuvchi',
  currency: 'UZS',
  monthlyLimit: 6000000 // 6M UZS monthly limit default
};

const App = () => {
  const { t } = useTranslation();

  // Session handling state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('cashflow_active_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Load data dynamically per logged in user directly on mount
  const [transactions, setTransactions] = useState(() => {
    const active = localStorage.getItem('cashflow_active_user');
    if (active) {
      const user = JSON.parse(active);
      const savedTrans = localStorage.getItem(`cashflow_transactions_${user.id}`);
      return savedTrans ? JSON.parse(savedTrans) : [];
    }
    return [];
  });

  const [cards, setCards] = useState(() => {
    const active = localStorage.getItem('cashflow_active_user');
    if (active) {
      const user = JSON.parse(active);
      const savedCards = localStorage.getItem(`cashflow_cards_${user.id}`);
      return savedCards ? JSON.parse(savedCards) : [];
    }
    return [];
  });

  const [settings, setSettings] = useState(() => {
    const active = localStorage.getItem('cashflow_active_user');
    if (active) {
      const user = JSON.parse(active);
      const savedSettings = localStorage.getItem(`cashflow_settings_${user.id}`);
      return savedSettings ? JSON.parse(savedSettings) : {
        userName: user.name,
        currency: 'UZS',
        monthlyLimit: 6000000
      };
    }
    return DEFAULT_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Sync to local storage per-user
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`cashflow_transactions_${currentUser.id}`, JSON.stringify(transactions));
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`cashflow_cards_${currentUser.id}`, JSON.stringify(cards));
    }
  }, [cards, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`cashflow_settings_${currentUser.id}`, JSON.stringify(settings));
    }
  }, [settings, currentUser]);

  // Auth actions
  const handleLogin = (user) => {
    localStorage.setItem('cashflow_active_user', JSON.stringify(user));
    
    // Load new user's database instantly to avoid session state leaks
    const savedTrans = localStorage.getItem(`cashflow_transactions_${user.id}`);
    const nextTrans = savedTrans ? JSON.parse(savedTrans) : [];
    
    const savedCards = localStorage.getItem(`cashflow_cards_${user.id}`);
    const nextCards = savedCards ? JSON.parse(savedCards) : [];
    
    const savedSettings = localStorage.getItem(`cashflow_settings_${user.id}`);
    const nextSettings = savedSettings ? JSON.parse(savedSettings) : {
      userName: user.name,
      currency: 'UZS',
      monthlyLimit: 6000000
    };

    setTransactions(nextTrans);
    setCards(nextCards);
    setSettings(nextSettings);
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('cashflow_active_user');
    
    // Reset all React state in memory to defaults immediately
    setTransactions([]);
    setCards([]);
    setSettings(DEFAULT_SETTINGS);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Card Handlers
  const handleAddCard = (newCard) => {
    setCards((prev) => [...prev, newCard]);
  };

  const handleDeleteCard = (cardId) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
    // Re-assign transactions of deleted card to Cash
    setTransactions((prev) => {
      const updated = prev.map((tCode) => (tCode.bank === cardId ? { ...tCode, bank: 'bank_cash' } : tCode));
      if (currentUser) {
        localStorage.setItem(`cashflow_transactions_${currentUser.id}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Add SMS Transaction parsed instantly
  const handleAddTransactionParsed = (parsedTrans) => {
    const newTrans = {
      id: Date.now().toString(),
      ...parsedTrans
    };
    setTransactions((prev) => [newTrans, ...prev]);
  };

  // Handlers
  const handleAddOrUpdateTransaction = (transaction) => {
    if (editingTransaction) {
      // Update existing
      setTransactions((prev) =>
        prev.map((tCode) => (tCode.id === transaction.id ? transaction : tCode))
      );
      setEditingTransaction(null);
    } else {
      // Add new
      setTransactions((prev) => [transaction, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteTransaction = (id) => {
    if (window.confirm(t('deleteConfirm'))) {
      setTransactions((prev) => {
        const updated = prev.filter((tCode) => tCode.id !== id);
        if (currentUser) {
          localStorage.setItem(`cashflow_transactions_${currentUser.id}`, JSON.stringify(updated));
        }
        return updated;
      });
    }
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const handleResetData = () => {
    setTransactions([]);
    setCards([]);
    setSettings({
      userName: currentUser ? currentUser.name : 'User',
      currency: 'UZS',
      monthlyLimit: 6000000
    });
    if (currentUser) {
      localStorage.setItem(`cashflow_transactions_${currentUser.id}`, JSON.stringify([]));
      localStorage.setItem(`cashflow_cards_${currentUser.id}`, JSON.stringify([]));
    }
  };

  // Optional developer UZS mock loader
  const handleLoadSampleData = () => {
    const d = new Date();
    const getRelative = (daysAgo) => {
      const dateObj = new Date();
      dateObj.setDate(d.getDate() - daysAgo);
      return dateObj.toISOString().split('T')[0];
    };

    // Load UZS sample transactions and matching cards
    const sampleCards = [
      { id: 'card-1', name: 'Kapitalbank Humo', type: 'humo', number: '9860120034005678', initialBalance: 12000000 },
      { id: 'card-2', name: 'TBC Bank Uzcard', type: 'uzcard', number: '8600450067008912', initialBalance: 3000000 }
    ];

    const sampleTransactions = [
      { id: 's-1', type: 'income', amount: 8500000, category: 'salary', date: getRelative(5), description: 'Oylik ish haqi (Зарплата)', bank: 'card-1' },
      { id: 's-2', type: 'expense', amount: 240000, category: 'food', date: getRelative(4), description: 'Korzinka supermarket xaridlari', bank: 'card-1' },
      { id: 's-3', type: 'expense', amount: 18000, category: 'transport', date: getRelative(4), description: 'Yandex Taxi safari', bank: 'card-2' },
      { id: 's-4', type: 'expense', amount: 350000, category: 'housing', date: getRelative(3), description: 'Kommunal to\'lovlar', bank: 'card-1' },
      { id: 's-5', type: 'income', amount: 1800000, category: 'freelance', date: getRelative(2), description: 'Freelance (Sayt vizitka)', bank: 'card-1' },
      { id: 's-6', type: 'expense', amount: 140000, category: 'entertainment', date: getRelative(2), description: 'Oqtepa Lavash tushlik', bank: 'bank_cash' },
    ];

    setCards(sampleCards);
    setTransactions(sampleTransactions);
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  // Render view content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            transactions={transactions}
            settings={settings}
            onAddClick={handleOpenAddModal}
            onDeleteTransaction={handleDeleteTransaction}
            cards={cards}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onAddTransaction={handleAddTransactionParsed}
          />
        );
      case 'incomes':
        return (
          <Incomes
            transactions={transactions}
            settings={settings}
            onAddClick={handleOpenAddModal}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'expenses':
        return (
          <Expenses
            transactions={transactions}
            settings={settings}
            onAddClick={handleOpenAddModal}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={transactions}
            settings={settings}
            onDeleteTransaction={handleDeleteTransaction}
            onEditClick={handleEditClick}
            cards={cards}
          />
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetData={handleResetData}
            onLoadSampleData={handleLoadSampleData}
            onLogout={handleLogout}
          />
        );
      default:
        return (
          <Dashboard
            transactions={transactions}
            settings={settings}
            onAddClick={handleOpenAddModal}
            onDeleteTransaction={handleDeleteTransaction}
            cards={cards}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onAddTransaction={handleAddTransactionParsed}
          />
        );
    }
  };

  // Render Login screen if not authenticated
  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  // Render Admin Workspace if logged in as admin
  if (currentUser.email === 'admin@cashflow.uz') {
    return (
      <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans p-6 md:p-12 overflow-y-auto">
        <AdminPanel onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans flex flex-col md:flex-row relative">
      {/* Background visual effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -z-10"></div>

      {/* Sidebar for Desktop, Tablet, TV */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onAddClick={handleOpenAddModal}
        onLogout={handleLogout}
      />

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800/80 sticky top-0 z-35 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <img src={Logo} alt="CashFlow Logo" className="w-8 h-8 rounded-lg object-cover border border-slate-850" />
          <span className="font-extrabold text-sm tracking-wider text-white">{t('brandTitle')}</span>
        </div>
        
        {/* Navigation Shortcut to full history */}
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all duration-300 ${
            activeTab === 'transactions'
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:text-white'
          }`}
        >
          🔄 {t('tabTransactions')}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-6 md:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-8 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Nav bar for mobile */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onAddClick={handleOpenAddModal}
      />

      {/* Transaction Modal (Add/Edit) */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onAdd={handleAddOrUpdateTransaction}
        editTransaction={editingTransaction}
        settings={settings}
        cards={cards}
      />
    </div>
  );
};

export default App;