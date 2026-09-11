import { useState } from 'react';
import type { Language } from '../types';
import { COMPANY } from '../data/company';

interface Props {
  isRTL: boolean;
  lang: Language;
  setLang: (l: Language) => void;
  trialDaysLeft: number;
  activated: boolean;
  onLogin: (username: string, password: string) => boolean;
}

export default function Login({ isRTL, lang, setLang, trialDaysLeft, activated, onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = onLogin(username, password);
    if (!ok) setError(true);
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center p-6 relative overflow-hidden">
      {/* ambient glow */}
      <div className="absolute -top-40 -start-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -end-40 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <span className="text-cyan-400 font-bold font-gaming tracking-wider">PS</span>
          </div>
          <div>
            <div className="text-white text-xl font-bold font-gaming leading-tight">{isRTL ? COMPANY.nameAr : COMPANY.name}</div>
            <div className="text-slate-500 text-xs">{isRTL ? 'نظام إدارة المقهى' : 'Café Management System'}</div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-[#141720] border border-[#252a36] rounded-2xl p-6 space-y-4 shadow-2xl">
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">{isRTL ? 'اسم المستخدم' : 'Username'}</label>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setError(false); }}
              autoFocus
              className="w-full bg-[#0d0f14] border border-[#252a36] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              placeholder="admin / cashier"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-1.5">{isRTL ? 'كلمة المرور' : 'Password'}</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              className="w-full bg-[#0d0f14] border border-[#252a36] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
              {isRTL ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password'}
            </div>
          )}

          <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl text-sm font-gaming transition-colors">
            {isRTL ? 'تسجيل الدخول' : 'Sign In'}
          </button>

          <div className="text-center text-[11px] text-slate-600">
            {isRTL ? 'تجريبي:' : 'Demo:'} admin / admin123 · cashier / cashier123
          </div>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-slate-500 hover:text-slate-300 transition-colors">
            🌐 {lang === 'en' ? 'عربي' : 'English'}
          </button>
          <span className={activated ? 'text-green-500' : 'text-amber-500'}>
            {activated
              ? (isRTL ? '✓ مُفعّل' : '✓ Licensed')
              : (isRTL ? `النسخة التجريبية — ${trialDaysLeft} يوم متبقي` : `Free trial — ${trialDaysLeft} days left`)}
          </span>
        </div>
      </div>
    </div>
  );
}
