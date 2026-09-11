import { useState } from 'react';
import type { MenuItem, Category } from '../types';
import { money } from '../util';

interface Props {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  t: (k: string) => string;
  isRTL: boolean;
  [key: string]: unknown;
}

const EMPTY_ITEM: Omit<MenuItem, 'id'> = {
  name: '', nameAr: '', category: '', price: 0, costPrice: 0, stock: 0, lowStockThreshold: 5,
};

let nextId = 100;

export default function MenuManagement({ menuItems, setMenuItems, categories, setCategories, t, isRTL }: Props) {
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<MenuItem, 'id'>>(EMPTY_ITEM);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [catInput, setCatInput] = useState('');
  const [catInputAr, setCatInputAr] = useState('');
  const [showCatForm, setShowCatForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function openAdd() {
    setEditItem(null);
    setFormData({ ...EMPTY_ITEM, category: categories[0]?.id ?? '' });
    setShowForm(true);
  }

  function openEdit(item: MenuItem) {
    setEditItem(item);
    setFormData({ name: item.name, nameAr: item.nameAr, category: item.category, price: item.price, costPrice: item.costPrice, stock: item.stock, lowStockThreshold: item.lowStockThreshold });
    setShowForm(true);
  }

  function saveItem() {
    if (!formData.name || !formData.category) return;
    if (editItem) {
      setMenuItems(prev => prev.map(i => i.id === editItem.id ? { ...editItem, ...formData } : i));
    } else {
      setMenuItems(prev => [...prev, { id: `m${nextId++}`, ...formData }]);
    }
    setShowForm(false);
  }

  function deleteItem(id: string) {
    setMenuItems(prev => prev.filter(i => i.id !== id));
    setDeleteConfirm(null);
  }

  function addCategory() {
    if (!catInput.trim()) return;
    setCategories(prev => [...prev, { id: `cat${nextId++}`, name: catInput.trim(), nameAr: catInputAr.trim() || catInput.trim() }]);
    setCatInput(''); setCatInputAr(''); setShowCatForm(false);
  }

  function deleteCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  const filtered = menuItems
    .filter(i => !filterCat || i.category === filterCat)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.nameAr.includes(search));

  const catName = (id: string) => {
    const c = categories.find(c => c.id === id);
    return c ? (isRTL ? c.nameAr : c.name) : '—';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0f111a] overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-200 dark:border-slate-700/50 px-6 py-4 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{isRTL ? 'إدارة القائمة' : 'Menu Management'}</h1>
          <p className="text-slate-500 dark:text-slate-500 text-sm">{menuItems.length} {isRTL ? 'عنصر' : 'items'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCatForm(v => !v)} className="px-3 py-2 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg text-sm transition-colors">
            ＋ {isRTL ? 'فئة' : 'Category'}
          </button>
          <button onClick={openAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors">
            ＋ {isRTL ? 'إضافة عنصر' : 'Add Item'}
          </button>
        </div>
      </div>

      {/* Category manager */}
      {showCatForm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800/50 px-6 py-3 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <span key={cat.id} className="inline-flex items-center gap-1 bg-white dark:bg-[#252a36] border border-slate-200 dark:border-slate-700/50 rounded-full px-3 py-1 text-sm text-slate-700 dark:text-slate-300">
                  {isRTL ? cat.nameAr : cat.name}
                  <button onClick={() => deleteCategory(cat.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 ms-1 text-xs leading-none">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 ms-auto">
              <input type="text" placeholder={isRTL ? 'اسم بالعربي' : 'Name (EN)'} value={catInput} onChange={e => setCatInput(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] dark:text-slate-100 w-32" />
              <input type="text" placeholder={isRTL ? 'Name (AR)' : 'اسم (AR)'} value={catInputAr} onChange={e => setCatInputAr(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] dark:text-slate-100 w-32" />
              <button onClick={addCategory} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition-colors">
                {isRTL ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-[#1a1d26] border-b border-slate-100 dark:border-slate-700/30 px-6 py-3 shrink-0 flex items-center gap-3">
        <input type="search" placeholder={isRTL ? 'بحث…' : 'Search…'} value={search} onChange={e => setSearch(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-300 w-52 bg-white dark:bg-[#1a1d26] dark:text-slate-100" />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] text-slate-700 dark:text-slate-300">
          <option value="">{isRTL ? 'جميع الفئات' : 'All categories'}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{isRTL ? c.nameAr : c.name}</option>)}
        </select>
        <div className="ms-auto text-slate-400 dark:text-slate-500 text-xs">{filtered.length} {isRTL ? 'نتيجة' : 'results'}</div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-50 dark:bg-[#0f111a] border-b border-slate-200 dark:border-slate-700/50 z-10">
            <tr>
              {[
                isRTL ? 'الاسم' : 'Name',
                isRTL ? 'الفئة' : 'Category',
                isRTL ? 'السعر' : 'Price',
                isRTL ? 'التكلفة' : 'Cost',
                isRTL ? 'المخزون' : 'Stock',
                isRTL ? 'الحد الأدنى' : 'Min. Stock',
                isRTL ? 'الإجراءات' : 'Actions',
              ].map((h, i) => (
                <th key={i} className={`px-4 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider text-start ${i === 6 ? 'text-end' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
            {filtered.map(item => {
              const lowStock = item.stock <= item.lowStockThreshold;
              return (
                <tr key={item.id} className="bg-white dark:bg-[#1a1d26] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-slate-900 dark:text-slate-100 font-medium text-sm">{item.name}</div>
                    <div className="text-slate-400 dark:text-slate-500 text-xs">{item.nameAr}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 dark:bg-[#252a36] text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{catName(item.category)}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-900 dark:text-slate-100">{money(item.price, isRTL)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-500 dark:text-slate-500">{money(item.costPrice, isRTL)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono text-sm font-semibold ${lowStock ? 'text-amber-600' : 'text-slate-900 dark:text-slate-100'}`}>{item.stock}</span>
                    {lowStock && <span className="ms-1.5 text-[10px] text-amber-500 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">{isRTL ? 'منخفض' : 'Low'}</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-500 dark:text-slate-500">{item.lowStockThreshold}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(item)} className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg transition-colors">
                        {isRTL ? 'تعديل' : 'Edit'}
                      </button>
                      <button onClick={() => setDeleteConfirm(item.id)} className="px-3 py-1.5 text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg transition-colors">
                        {isRTL ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1a1d26] rounded-2xl shadow-xl w-[480px] max-h-[85vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/30 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{editItem ? (isRTL ? 'تعديل عنصر' : 'Edit Item') : (isRTL ? 'إضافة عنصر' : 'Add Item')}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'الاسم (EN)' : 'Name (EN)'}</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 dark:bg-[#1a1d26] dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">الاسم (AR)</label>
                  <input type="text" dir="rtl" value={formData.nameAr} onChange={e => setFormData(p => ({ ...p, nameAr: e.target.value }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 dark:bg-[#1a1d26] dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'الفئة' : 'Category'}</label>
                <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 bg-white dark:bg-[#1a1d26] dark:text-slate-300">
                  {categories.map(c => <option key={c.id} value={c.id}>{isRTL ? c.nameAr : c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'السعر (ج.م)' : 'Price (EGP)'}</label>
                  <input type="number" min={0} step={0.5} value={formData.price} onChange={e => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 font-mono dark:bg-[#1a1d26] dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'سعر التكلفة (ج.م)' : 'Cost Price (EGP)'}</label>
                  <input type="number" min={0} step={0.5} value={formData.costPrice} onChange={e => setFormData(p => ({ ...p, costPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 font-mono dark:bg-[#1a1d26] dark:text-slate-100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'الكمية' : 'Stock Qty'}</label>
                  <input type="number" min={0} value={formData.stock} onChange={e => setFormData(p => ({ ...p, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 font-mono dark:bg-[#1a1d26] dark:text-slate-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{isRTL ? 'حد التنبيه' : 'Low Stock Alert'}</label>
                  <input type="number" min={0} value={formData.lowStockThreshold} onChange={e => setFormData(p => ({ ...p, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 font-mono dark:bg-[#1a1d26] dark:text-slate-100" />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl text-sm transition-colors">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={saveItem} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors">
                {isRTL ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1a1d26] rounded-2xl shadow-xl p-6 w-80 text-center">
            <div className="text-2xl mb-2">🗑️</div>
            <div className="text-slate-900 dark:text-slate-100 font-semibold mb-1">{isRTL ? 'تأكيد الحذف' : 'Delete Item?'}</div>
            <div className="text-slate-500 dark:text-slate-500 text-sm mb-5">{isRTL ? 'لا يمكن التراجع عن هذا الإجراء.' : 'This action cannot be undone.'}</div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">{isRTL ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => deleteItem(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl text-sm transition-colors">{isRTL ? 'حذف' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
