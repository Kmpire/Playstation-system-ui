import { useState } from 'react';

interface Props {
  isRTL: boolean;
  onActivate: (code: string) => boolean;
}

export default function TrialExpired({ isRTL, onActivate }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!onActivate(code)) setError(true);
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-5">🔒</div>
        <h1 className="text-white text-2xl font-bold font-gaming mb-2">{isRTL ? 'انتهت الفترة التجريبية' : 'Trial Expired'}</h1>
        <p className="text-slate-400 text-sm mb-8 max-w-sm mx-auto">
          {isRTL
            ? 'انتهت النسخة التجريبية المجانية لمدة 7 أيام. أدخل رمز التفعيل لمواصلة استخدام التطبيق.'
            : 'Your 7-day free trial has ended. Enter a license / activation code to unlock the app and continue.'}
        </p>

        <form onSubmit={submit} className="bg-[#141720] border border-[#252a36] rounded-2xl p-6 space-y-4">
          <input
            value={code}
            onChange={e => { setCode(e.target.value); setError(false); }}
            placeholder={isRTL ? 'رمز التفعيل' : 'Activation code'}
            className="w-full bg-[#0d0f14] border border-[#252a36] rounded-lg px-3 py-3 text-white text-center font-mono tracking-widest focus:outline-none focus:border-cyan-500/50"
          />
          {error && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
              {isRTL ? 'رمز التفعيل غير صالح' : 'Invalid activation code'}
            </div>
          )}
          <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 rounded-xl text-sm font-gaming transition-colors">
            {isRTL ? 'تفعيل' : 'Activate'}
          </button>
          <div className="text-[11px] text-slate-600">{isRTL ? 'تجريبي:' : 'Demo code:'} PSCAFE-PRO-2026</div>
        </form>
      </div>
    </div>
  );
}
