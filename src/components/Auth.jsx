import React, { useState } from 'react';
import { playTick, playFocus, playSuccess, playError } from '../utils/sounds';
import { useTranslation } from '../utils/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import Logo from '../assets/logo-CASHFLOW.jpg';

const Auth = ({ onLogin }) => {
  const { t, language } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Mouse move 3D tilt trackers
  const handleMouseMove3D = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = -(y - yc) / 10;
    const angleY = (x - xc) / 10;
    
    el.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave3D = (e) => {
    const el = e.currentTarget;
    el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  // Auto-format Uzbek phone number format: +998 (99) 999-99-99
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    playTick();
    
    // Strip non-digits
    let clean = value.replace(/\D/g, '');
    
    if (clean.startsWith('998')) {
      // Keep it
    } else if (clean.length > 0) {
      clean = '998' + clean;
    }

    if (clean.length === 0) {
      setPhone('');
      return;
    }

    let formatted = '+998';
    if (clean.length > 3) {
      formatted += ' (' + clean.slice(3, 5);
    }
    if (clean.length >= 6) {
      formatted += ') ' + clean.slice(5, 8);
    }
    if (clean.length >= 9) {
      formatted += '-' + clean.slice(8, 10);
    }
    if (clean.length >= 11) {
      formatted += '-' + clean.slice(10, 12);
    }
    
    // Max Uzbek format length: 19 characters (+998 (90) 123-45-67)
    setPhone(formatted.slice(0, 19));
  };

  // Password validators
  const hasMinLength = password.length >= 6;
  const hasDigit = /\d/.test(password);
  const hasUppercase = /[A-ZА-Я]/.test(password);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (isSignUp) {
      if (!name.trim()) {
        setErrorMsg(t('authErrName'));
        playError();
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg(t('authErrEmail'));
        playError();
        return;
      }
      if (phone.length < 19) {
        setErrorMsg(t('authErrPhone'));
        playError();
        return;
      }
      if (!hasMinLength || !hasDigit || !hasUppercase) {
        setErrorMsg(t('authErrPassSafety'));
        playError();
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(t('authErrPassMismatch'));
        playError();
        return;
      }

      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('cashflow_users') || '[]');
      const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase() || u.phone === phone);
      if (userExists) {
        setErrorMsg(t('authErrUserExists'));
        playError();
        return;
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.toLowerCase(),
        phone,
        password
      };

      users.push(newUser);
      localStorage.setItem('cashflow_users', JSON.stringify(users));
      
      playSuccess();
      onLogin(newUser);
    } else {
      if (!email.trim()) {
        setErrorMsg(t('authEmailOrPhone'));
        playError();
        return;
      }
      if (!password) {
        setErrorMsg(t('authPassword'));
        playError();
        return;
      }

      // Admin backdoor
      if (email.toLowerCase() === 'admin@cashflow.uz' && password === 'admin') {
        const adminUser = {
          id: 'admin',
          name: 'Administrator',
          email: 'admin@cashflow.uz',
          phone: '+998 (99) 000-00-00',
          password: 'admin'
        };
        playSuccess();
        onLogin(adminUser);
        return;
      }

      // Look up user in localStorage or demo credentials
      let foundUser = null;
      if (email.toLowerCase().trim() === 'demo' && password === 'demo') {
        foundUser = {
          id: 'demo-user-id',
          name: language === 'uz' ? 'Demo Foydalanuvchi' : 'Demo Пользователь',
          email: 'demo@cashflow.uz',
          phone: '+998 (99) 999-99-99',
          password: 'demo'
        };
      } else {
        const users = JSON.parse(localStorage.getItem('cashflow_users') || '[]');
        const cleanInput = email.replace(/\D/g, '');
        foundUser = users.find(u => {
          const emailMatch = u.email.toLowerCase() === email.toLowerCase().trim();
          const cleanUserPhone = u.phone ? u.phone.replace(/\D/g, '') : '';
          const phoneMatch = u.phone === email.trim() || (cleanInput && cleanUserPhone === cleanInput);
          return (emailMatch || phoneMatch) && u.password === password;
        });
      }

      if (!foundUser) {
        setErrorMsg(t('authErrInvalidCreds'));
        playError();
        return;
      }

      playSuccess();
      onLogin(foundUser);
    }
  };

  const toggleMode = () => {
    playTick();
    setIsSignUp(!isSignUp);
    setErrorMsg('');
    setPassword('');
    setConfirmPassword('');
  };

  const currencySymbol = language === 'uz' ? "so'm" : 'сум';

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col md:flex-row relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-indigo-500/10 blur-3xl -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[85%] h-[85%] rounded-full bg-purple-500/10 blur-3xl -z-10"></div>

      {/* Language Switcher in top right corner absolute position */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Left split-pane: Branding & Mock Finance Graphics (hidden on mobile) */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 bg-slate-900/40 border-r border-slate-800/80 relative">
        <div className="flex items-center gap-3">
          <img src={Logo} alt="CashFlow Logo" className="w-10 h-10 rounded-xl object-cover border border-slate-800 shadow-md" />
          <span className="font-extrabold text-lg tracking-wider text-white">{t('brandTitle')}</span>
        </div>

        <div className="space-y-6 max-w-md my-auto">
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
            {language === 'uz' ? (
              <>Moliyangizni oson va <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">chiroyli nazorat</span> qiling.</>
            ) : (
              <>Контролируйте свои финансы <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">легко и красиво</span>.</>
            )}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {t('authSubtitle')}
          </p>

          {/* Interactive Mock Card */}
          <div 
            onMouseMove={handleMouseMove3D}
            onMouseLeave={handleMouseLeave3D}
            className="p-5 bg-gradient-to-tr from-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl shadow-2xl relative overflow-hidden mt-8 max-w-sm group hover:border-indigo-500/30 transition-transform duration-150 ease-out card-3d-container card-3d-element cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl card-3d-depth"></div>
            <div className="flex items-center justify-between mb-4 card-3d-depth">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('authMockTitle')}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <h3 className="text-2xl font-black text-white card-3d-depth-high">6 500 000 {currencySymbol}</h3>
            <div className="mt-4 flex gap-4 text-xs font-semibold card-3d-depth">
              <span className="text-emerald-400">📈 +8 000 000 {currencySymbol}</span>
              <span className="text-rose-500">📉 -1 500 000 {currencySymbol}</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden card-3d-depth-flat">
              <div className="w-[81%] h-full bg-indigo-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          © 2026 CashFlow Uzbekistan. {language === 'uz' ? "Barcha huquqlar himoyalangan." : "Все права защищены."}
        </div>
      </div>

      {/* Right split-pane: Authentication Forms */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 mt-12 md:mt-0">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile branding */}
          <div className="flex flex-col items-center md:hidden mb-6 text-center">
            <img src={Logo} alt="CashFlow Logo" className="w-16 h-16 rounded-2xl object-cover border border-slate-850 shadow-xl mb-3" />
            <h2 className="font-extrabold text-xl tracking-wider text-white">{t('brandTitle')}</h2>
            <p className="text-slate-500 text-xs mt-1">{t('brandSubtitle')}</p>
          </div>

          {/* Form wrapper */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>

            {/* View switch tabs */}
            <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-850 mb-6">
              <button
                type="button"
                onClick={toggleMode}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                  !isSignUp
                    ? 'bg-slate-850 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {t('authLoginTab')}
              </button>
              <button
                type="button"
                onClick={toggleMode}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                  isSignUp
                    ? 'bg-slate-850 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {t('authRegisterTab')}
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl animate-shake">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('authName')}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onFocus={playFocus}
                      onChange={(e) => { playTick(); setName(e.target.value); }}
                      placeholder={language === 'uz' ? 'Anvar' : 'Иван'}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </>
              )}

              {/* Email / Username field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isSignUp ? t('authEmail') : t('authEmailOrPhone')}
                </label>
                <input
                  type={isSignUp ? 'email' : 'text'}
                  required
                  value={email}
                  onFocus={playFocus}
                  onChange={(e) => { playTick(); setEmail(e.target.value); }}
                  placeholder={isSignUp ? 'user@domain.uz' : 'demo'}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              {isSignUp && (
                <>
                  {/* Phone field (Uzbekistan format) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('authPhone')}</label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onFocus={playFocus}
                      onChange={handlePhoneChange}
                      placeholder="+998 (99) 123-45-67"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all font-mono"
                    />
                  </div>
                </>
              )}

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('authPassword')}</label>
                  {!isSignUp && (
                    <span className="text-[10px] text-indigo-400 hover:underline cursor-pointer" onClick={() => alert('Demo login: "demo", password: "demo"')}>
                      {t('authForgotPassword')}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onFocus={playFocus}
                    onChange={(e) => { playTick(); setPassword(e.target.value); }}
                    placeholder={isSignUp ? '••••••••' : 'demo'}
                    className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => { playTick(); setShowPassword(!showPassword); }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 text-sm focus:outline-none cursor-pointer"
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <>
                  {/* Real-time password validators UI */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold">
                      <span className={hasMinLength ? 'text-emerald-400' : 'text-slate-650'}>
                        {hasMinLength ? '✓' : '○'}
                      </span>
                      <span className={hasMinLength ? 'text-slate-350' : 'text-slate-500'}>6+ {language === 'uz' ? 'belgi' : 'симп.'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold">
                      <span className={hasDigit ? 'text-emerald-400' : 'text-slate-650'}>
                        {hasDigit ? '✓' : '○'}
                      </span>
                      <span className={hasDigit ? 'text-slate-350' : 'text-slate-500'}>{language === 'uz' ? 'Raqam' : 'Цифра'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold">
                      <span className={hasUppercase ? 'text-emerald-400' : 'text-slate-650'}>
                        {hasUppercase ? '✓' : '○'}
                      </span>
                      <span className={hasUppercase ? 'text-slate-350' : 'text-slate-500'}>{language === 'uz' ? 'KATTA' : 'ЗАГЛАВНАЯ'}</span>
                    </div>
                  </div>

                  {/* Confirm Password field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('authConfirmPassword')}</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onFocus={playFocus}
                      onChange={(e) => { playTick(); setConfirmPassword(e.target.value); }}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-650 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                </>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-650 to-pink-500 hover:from-indigo-650 hover:to-pink-650 text-white text-xs font-black rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all duration-300 mt-2 cursor-pointer"
              >
                {isSignUp ? t('authSignUpBtn') : t('authSignInBtn')}
              </button>
            </form>
          </div>

          {/* Test credentials footer help */}
          {!isSignUp && (
            <div className="space-y-2">
              <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/35 rounded-2xl text-[10px] text-center text-slate-400">
                💡 {t('authDemoHelp')}
              </div>
              <button
                type="button"
                onClick={() => {
                  playTick();
                  setEmail('admin@cashflow.uz');
                  setPassword('admin');
                  // Trigger login submission helper
                  setTimeout(() => {
                    const btn = document.querySelector('button[type="submit"]');
                    if (btn) btn.click();
                  }, 100);
                }}
                className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700/40"
              >
                🛡️ {t('adminPanel')} (Backdoor)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
