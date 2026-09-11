import React, { useState } from 'react';
import {
  ShoppingCart,
  CheckCircle2,
  Coffee,
  Plus,
  Minus,
  Trash2,
  Tag,
  Receipt,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
} from 'lucide-react';
import type { MenuItem, Category } from '../types';
import { money } from '../util';
import Button from '../components/ui/Button';

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

function ReceiptView({
  entries,
  total,
  discount,
  promoLabel,
  isRTL,
  onDone,
}: {
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
    <div className="flex h-full bg-slate-50 dark:bg-[#07090e] items-center justify-center p-4 sm:p-8 select-none">
      <div className="bg-white dark:bg-[#0f131d] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-6 sm:p-7">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10 animate-in zoom-in-75">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {isRTL ? 'تم تسجيل البيع بنجاح' : 'Sale Completed'}
          </h3>
          <div className="text-slate-400 text-xs mt-1">{now.toLocaleString()}</div>
        </div>

        {/* Itemized list */}
        <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
          {entries.map((e) => (
            <div
              key={e.item.id}
              className="flex justify-between items-center text-xs sm:text-sm p-2 rounded-xl bg-slate-50 dark:bg-[#141926]"
            >
              <span className="text-slate-700 dark:text-slate-200 font-medium">
                {isRTL && e.item.nameAr ? e.item.nameAr : e.item.name} × {e.qty}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {money(e.item.price * e.qty, isRTL)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs sm:text-sm">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>{isRTL ? 'المجموع الجزئي' : 'Subtotal'}</span>
            <span className="font-mono">{money(subtotal, isRTL)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-emerald-500 font-medium">
              <span>
                {isRTL ? `خصم ترويجي (${promoLabel})` : `Discount (${promoLabel})`}
              </span>
              <span className="font-mono">−{money(discount, isRTL)}</span>
            </div>
          )}

          <div className="flex justify-between items-center font-bold text-base sm:text-lg text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{isRTL ? 'المبلغ المستلم (نقدي)' : 'Total Paid (Cash)'}</span>
            <span className="font-mono text-[#0070d1] dark:text-sky-400">
              {money(total, isRTL)}
            </span>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={onDone}
          fullWidth
          size="lg"
          className="mt-6"
        >
          {isRTL ? 'طلب بيع جديد' : 'New Sale'}
        </Button>
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
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const filtered = selCat
    ? menuItems.filter((i) => i.category === selCat)
    : menuItems;

  const subtotal = cart.reduce((s, e) => s + e.item.price * e.qty, 0);
  const discount = promoApplied ? subtotal * 0.1 : 0;
  const total = subtotal - discount;
  const totalItemsCount = cart.reduce((s, e) => s + e.qty, 0);

  function addItem(item: MenuItem) {
    if (item.stock <= 0) return;
    setCart((prev) => {
      const idx = prev.findIndex((e) => e.item.id === item.id);
      if (idx >= 0) {
        return prev.map((e, i) => (i === idx ? { ...e, qty: e.qty + 1 } : e));
      }
      return [...prev, { item, qty: 1 }];
    });
  }

  function changeQty(itemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((e) => (e.item.id === itemId ? { ...e, qty: e.qty + delta } : e))
        .filter((e) => e.qty > 0)
    );
  }

  function applyPromo() {
    const valid = ['PLAY10', 'CAFE10', 'VIP10'];
    if (valid.includes(promoCode.trim().toUpperCase())) {
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
    setMobileCartOpen(false);
  }

  if (showReceipt) {
    return (
      <ReceiptView
        entries={cart}
        total={total}
        discount={discount}
        promoLabel={promoCode.toUpperCase() || 'PROMO'}
        isRTL={isRTL}
        onDone={handleDone}
      />
    );
  }

  return (
    <div className="flex h-full bg-slate-50 dark:bg-[#07090e] overflow-hidden select-none relative">
      {/* Left / Main area: Item browser */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Category Filter Pills */}
        <div className="bg-white/80 dark:bg-[#0e121b]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-3 flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelCat('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selCat === ''
                ? 'bg-[#0070d1] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isRTL ? 'جميع الأصناف' : 'All Categories'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelCat(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selCat === cat.id
                  ? 'bg-[#0070d1] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {isRTL ? cat.nameAr : cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid - Responsive */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-6">
          <div className="text-slate-400 text-xs font-semibold mb-3 uppercase tracking-wider">
            {isRTL ? `${filtered.length} صنف متاح` : `${filtered.length} items available`}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((item) => {
              const inCart = cart.find((e) => e.item.id === item.id);
              const lowStock = item.stock <= item.lowStockThreshold;

              return (
                <button
                  key={item.id}
                  onClick={() => addItem(item)}
                  disabled={item.stock <= 0}
                  className={`relative p-3.5 rounded-2xl bg-white dark:bg-[#0e121b] border text-start transition-all duration-200 flex flex-col justify-between active:scale-[0.98] ${
                    item.stock <= 0
                      ? 'opacity-40 pointer-events-none border-slate-200 dark:border-slate-800'
                      : inCart
                      ? 'border-[#0070d1] ring-2 ring-[#0070d1]/20 shadow-md'
                      : 'border-slate-200/80 dark:border-slate-800/80 hover:border-[#0070d1]/50 hover:shadow-md'
                  }`}
                >
                  {/* Cart badge quantity */}
                  {inCart && (
                    <span className="absolute top-2 end-2 bg-[#0070d1] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                      {inCart.qty}
                    </span>
                  )}

                  <div className="w-full h-20 rounded-xl bg-slate-100 dark:bg-[#151a26] mb-2.5 flex items-center justify-center text-slate-400">
                    <Coffee className="w-8 h-8 opacity-60 text-[#0070d1]" />
                  </div>

                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {isRTL && item.nameAr ? item.nameAr : item.name}
                    </div>
                    <div className="text-xs font-mono font-bold text-[#0070d1] dark:text-sky-400 mt-1">
                      {money(item.price, isRTL)}
                    </div>
                    {lowStock && (
                      <div className="text-amber-500 text-[10px] font-semibold mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>
                          {isRTL ? `المتبقي: ${item.stock}` : `Stock: ${item.stock}`}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating Mobile Cart Bar (visible on <lg screens) */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-16 inset-x-4 z-20">
          <button
            onClick={() => setMobileCartOpen(true)}
            className="w-full p-3.5 bg-[#0070d1] text-white rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <span>{isRTL ? 'عرض السلة' : 'View Cart'}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">
                {totalItemsCount}
              </span>
            </div>
            <span className="font-mono text-base">{money(total, isRTL)}</span>
          </button>
        </div>
      )}

      {/* Right / Cart Panel (Fixed on desktop, Slide-over on mobile) */}
      <div
        className={`fixed lg:static top-0 bottom-0 ${
          isRTL ? 'left-0' : 'right-0'
        } z-40 lg:z-auto w-full sm:w-80 lg:w-80 shrink-0 border-s border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0b0e17] flex flex-col transition-transform duration-300 ${
          mobileCartOpen
            ? 'translate-x-0'
            : isRTL
            ? '-translate-x-full lg:translate-x-0'
            : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#0070d1]" />
            <span className="font-bold text-sm text-slate-900 dark:text-white">
              {isRTL ? 'طلب البيع الحالي' : 'Current Order'}
            </span>
            <span className="text-xs text-slate-400 font-mono">({totalItemsCount})</span>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={() => setMobileCartOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto opacity-30 mb-2 stroke-1" />
              <p className="text-xs">
                {isRTL ? 'السلة فارغة، اختر الأصناف للإضافة' : 'Cart is empty. Tap items to add.'}
              </p>
            </div>
          ) : (
            cart.map(({ item, qty }) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#141926] border border-slate-200/60 dark:border-slate-800/80"
              >
                <div className="min-w-0 flex-1 pe-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {isRTL && item.nameAr ? item.nameAr : item.name}
                  </div>
                  <div className="text-xs font-mono text-[#0070d1] dark:text-sky-400">
                    {money(item.price, isRTL)}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => changeQty(item.id, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 flex items-center justify-center font-bold text-xs"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {qty}
                  </span>
                  <button
                    onClick={() => changeQty(item.id, 1)}
                    className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 flex items-center justify-center font-bold text-xs"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promo code & Checkout section */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3 bg-slate-50/50 dark:bg-[#0e121b]/50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={isRTL ? 'كود الخصم (PLAY10)' : 'Promo code (PLAY10)'}
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={promoApplied}
              className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#141926] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070d1]/30"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={applyPromo}
              disabled={promoApplied || !promoCode.trim()}
            >
              {promoApplied ? (isRTL ? 'مُطبّق' : 'Applied') : (isRTL ? 'تطبيق' : 'Apply')}
            </Button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>{isRTL ? 'المجموع الجزئي' : 'Subtotal'}</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {money(subtotal, isRTL)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-500 font-semibold">
                <span>{isRTL ? 'الخصم (10%)' : 'Discount (10%)'}</span>
                <span className="font-mono">−{money(discount, isRTL)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
              <span className="font-mono text-xl text-[#0070d1] dark:text-sky-400">
                {money(total, isRTL)}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            icon={<Receipt className="w-4 h-4" />}
          >
            {isRTL ? 'إتمام البيع — نقدي' : 'Complete Sale — Cash'}
          </Button>
        </div>
      </div>
    </div>
  );
}
