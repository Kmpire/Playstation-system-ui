import { useState } from 'react';
import type { MenuItem, Category } from '../types';
import { money } from '../util';

const CAT_EMOJI: Record<string, string> = {
  'Hot Drinks': '☕',
  'Cold Drinks': '🥤',
  Snacks: '🍟',
  Meals: '🍔',
};

function categoryEmoji(catName: string): string {
  return CAT_EMOJI[catName] ?? '🍽️';
}

interface CartEntry {
  item: MenuItem;
  qty: number;
}

interface Props {
  menuItems: MenuItem[];
  categories: Category[];
  t: (k: string) => string;
  isRTL: boolean;
  [key: string]: unknown;
}

function ReceiptView({ entries, total, discount, promoLabel, isRTL, onDone }: {
  entries: CartEntry[];
  total: number;
  discount: number;
  promoLabel: string;
  isRTL: boolean;
  onDone: () => void;
}) {
  const subtotal = entries.reduce((s, e) => s + e.item.price * e.qty, 0);
  const now = new Date();
  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#0f111a] items-center justify-center p-8">
      <div className="bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-md w-80 p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✅</div>
          <div className="text-slate-900 dark:text-slate-100 font-bold text-lg">{isRTL ? 'تمت عملية البيع' : 'Sale Complete'}</div>
          <div className="text-slate-500 dark:text-slate-500 text-xs mt-1">{now.toLocaleString()}</div>
        </div>
        <div className="space-y-2 mb-4">
          {entries.map(e => (
            <div key={e.item.id} className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300">{isRTL ? e.item.nameAr : e.item.name} × {e.qty}</span>
              <span className="font-mono text-slate-900 dark:text-slate-100">{money(e.item.price * e.qty, isRTL)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700/30 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-500">
            <span>{isRTL ? 'المجموع الجزئي' : 'Subtotal'}</span>
            <span className="font-mono">{money(subtotal, isRTL)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>{isRTL ? `خصم (${promoLabel})` : `Discount (${promoLabel})`}</span>
              <span className="font-mono">−{money(discount, isRTL)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 text-base pt-1 border-t border-slate-100 dark:border-slate-700/30 mt-1">
            <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
            <span className="font-mono">{money(total, isRTL)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-2">
            <span>{isRTL ? 'طريقة الدفع' : 'Payment'}</span>
            <span>💵 {isRTL ? 'نقدي' : 'Cash'}</span>
          </div>
        </div>
        <button
          onClick={onDone}
          className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {isRTL ? 'بيع جديد' : 'New Sale'}
        </button>
      </div>
    </div>
  );
}

export default function POSSales({ menuItems, categories, t, isRTL }: Props) {
  const [selCat, setSelCat] = useState<string>(categories[0]?.id ?? '');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const filtered = selCat ? menuItems.filter(i => i.category === selCat) : menuItems;
  const subtotal = cart.reduce((s, e) => s + e.item.price * e.qty, 0);
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  function addItem(item: MenuItem) {
    setCart(prev => {
      const idx = prev.findIndex(e => e.item.id === item.id);
      if (idx >= 0) return prev.map((e, i) => i === idx ? { ...e, qty: e.qty + 1 } : e);
      return [...prev, { item, qty: 1 }];
    });
  }

  function changeQty(itemId: string, delta: number) {
    setCart(prev =>
      prev
        .map(e => e.item.id === itemId ? { ...e, qty: e.qty + delta } : e)
        .filter(e => e.qty > 0)
    );
  }

  function applyPromo() {
    const valid = ['PLAY10', 'CAFE10', 'VIP10'];
    if (valid.includes(promoCode.toUpperCase())) {
      setPromoApplied(true);
    }
  }

  function handleCheckout() {
    if (cart.length === 0) return;
    setShowReceipt(true);
  }

  function handleDone() {
    setCart([]);
    setPromoCode('');
    setPromoApplied(false);
    setShowReceipt(false);
  }

  const catName = categories.find(c => c.id === selCat)?.name ?? '';

  if (showReceipt) {
    return (
      <ReceiptView
        entries={cart}
        total={total}
        discount={discount}
        promoLabel={promoCode}
        isRTL={isRTL}
        onDone={handleDone}
      />
    );
  }

  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#0f111a] overflow-hidden">
      {/* Left: item browser */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Screen header */}
        <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 py-4 shrink-0">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'نقطة البيع' : 'POS / Sales'}</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">{isRTL ? 'مبيعات الزبائن العابرين' : 'Walk-in customer sales'}</p>
        </div>

        {/* Category tabs */}
        <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 flex gap-0 shrink-0 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelCat(cat.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors -mb-px ${
                selCat === cat.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {categoryEmoji(cat.name)} {isRTL ? cat.nameAr : cat.name}
            </button>
          ))}
        </div>

        {/* Item grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-slate-400 dark:text-slate-500 text-xs mb-4 uppercase tracking-wider">{isRTL ? `${filtered.length} عنصر` : `${filtered.length} items in ${catName}`}</div>
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(item => {
              const inCart = cart.find(e => e.item.id === item.id);
              const lowStock = item.stock <= item.lowStockThreshold;
              return (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  className={`bg-white dark:bg-[#1a1d26] border rounded-xl p-4 text-start transition-all hover:shadow-md relative
                    ${inCart ? 'border-blue-300 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-slate-200 dark:border-slate-700/50 hover:border-blue-200'}`}
                >
                  {inCart && (
                    <span className="absolute top-2 end-2 bg-blue-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {inCart.qty}
                    </span>
                  )}
                  <div className="w-full h-20 bg-slate-50 dark:bg-[#252a36] rounded-lg mb-3 flex items-center justify-center text-3xl">
                    {categoryEmoji(categories.find(c => c.id === item.category)?.name ?? '')}
                  </div>
                  <div className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{isRTL ? item.nameAr : item.name}</div>
                  <div className="text-blue-600 dark:text-blue-400 font-mono font-semibold text-sm mt-1">{money(item.price, isRTL)}</div>
                  {lowStock && (
                    <div className="text-amber-500 text-[11px] mt-1">⚠ {isRTL ? `مخزون: ${item.stock}` : `Stock: ${item.stock}`}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: cart */}
      <div className="w-72 shrink-0 border-s border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#1a1d26] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
            {isRTL ? `الطلب — ${cart.length} عناصر` : `Order — ${cart.length} item${cart.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 && (
            <div className="text-center text-slate-400 dark:text-slate-500 text-sm py-10">
              <div className="text-3xl mb-2">🛒</div>
              {isRTL ? 'السلة فارغة' : 'Cart is empty'}
            </div>
          )}
          {cart.map(({ item, qty }) => (
            <div key={item.id} className="flex items-center gap-2 bg-slate-50 dark:bg-[#252a36] rounded-xl p-2.5 border border-slate-100 dark:border-slate-700/30">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{isRTL ? item.nameAr : item.name}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">{money(item.price, isRTL)}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded-lg bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-xs font-bold transition-colors">−</button>
                <span className="w-5 text-center text-sm font-semibold text-slate-800 dark:text-slate-200">{qty}</span>
                <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded-lg bg-white dark:bg-[#1a1d26] border border-slate-200 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-xs font-bold transition-colors">+</button>
              </div>
              <div className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100 w-14 text-end shrink-0">{money(item.price * qty, isRTL)}</div>
            </div>
          ))}
        </div>

        {/* Promo + totals + checkout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/30 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isRTL ? 'كود الخصم' : 'Promo code'}
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              disabled={promoApplied}
              className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-300 disabled:opacity-50 bg-white dark:bg-[#1a1d26] dark:text-slate-100"
            />
            <button
              onClick={applyPromo}
              disabled={promoApplied || !promoCode}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs rounded-lg transition-colors font-medium"
            >
              {promoApplied ? '✓' : (isRTL ? 'تطبيق' : 'Apply')}
            </button>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-500">
              <span>{isRTL ? 'المجموع الجزئي' : 'Subtotal'}</span>
              <span className="font-mono">{money(subtotal, isRTL)}</span>
            </div>
            {promoApplied && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>{isRTL ? 'خصم 10%' : '10% discount'}</span>
                <span className="font-mono">−{money(discount, isRTL)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 text-base border-t border-slate-100 dark:border-slate-700/30 pt-2 mt-1">
              <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
              <span className="font-mono">{money(total, isRTL)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors"
          >
            💵 {isRTL ? 'استلام — نقدي' : 'Complete Sale — Cash'}
          </button>
        </div>
      </div>
    </div>
  );
}
