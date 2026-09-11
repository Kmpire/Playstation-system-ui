import type {
  GameConsole,
  MenuItem,
  Category,
  PricingConfig,
  Controller,
  MaintenanceRecord,
  Customer,
  AuditEntry,
  ShiftReport,
} from '../types';

const now = Date.now();

export const initialConsoles: GameConsole[] = [
  {
    id: 1,
    name: 'PS5 — 01',
    type: 'PS5',
    status: 'occupied',
    dailyTotal: 42,
    session: {
      mode: 'prepaid',
      playerType: 'single',
      startTime: now - 45 * 60_000,
      pausedAt: null,
      totalPausedMs: 0,
      targetDurationMin: 60,
      priceSegments: [{ playerType: 'single', startElapsedMs: 0, ratePerHour: 4 }],
      tab: [{ id: 'm1', name: 'Pepsi', price: 2, qty: 1 }],
    },
  },
  { id: 2, name: 'PS5 — 02', type: 'PS5', status: 'available', dailyTotal: 68 },
  {
    id: 3,
    name: 'PS4 — 01',
    type: 'PS4',
    status: 'occupied',
    dailyTotal: 30,
    session: {
      mode: 'postpaid',
      playerType: 'multi',
      startTime: now - 93 * 60_000,
      pausedAt: null,
      totalPausedMs: 0,
      priceSegments: [
        { playerType: 'single', startElapsedMs: 0, ratePerHour: 3 },
        { playerType: 'multi', startElapsedMs: 30 * 60_000, ratePerHour: 4 },
      ],
      tab: [
        { id: 'm3', name: 'Coffee', price: 5, qty: 2 },
        { id: 'm5', name: 'Chips', price: 3, qty: 1 },
      ],
    },
  },
  {
    id: 4,
    name: 'PS4 — 02',
    type: 'PS4',
    status: 'paused',
    dailyTotal: 18,
    session: {
      mode: 'postpaid',
      playerType: 'single',
      startTime: now - 38 * 60_000,
      pausedAt: now - 6 * 60_000,
      totalPausedMs: 0,
      priceSegments: [{ playerType: 'single', startElapsedMs: 0, ratePerHour: 3 }],
      tab: [],
    },
  },
  { id: 5, name: 'Xbox — 01', type: 'Xbox', status: 'available', dailyTotal: 51 },
  { id: 6, name: 'Xbox — 02', type: 'Xbox', status: 'maintenance', dailyTotal: 0 },
  { id: 7, name: 'VIP Room', type: 'VIP', status: 'reserved', dailyTotal: 120 },
  { id: 8, name: 'PS5 — 03', type: 'PS5', status: 'available', dailyTotal: 24 },
  { id: 9, name: 'PS4 — 03', type: 'PS4', status: 'available', dailyTotal: 0 },
];

export const initialCategories: Category[] = [
  { id: 'c1', name: 'Hot Drinks', nameAr: 'مشروبات ساخنة' },
  { id: 'c2', name: 'Cold Drinks', nameAr: 'مشروبات باردة' },
  { id: 'c3', name: 'Snacks', nameAr: 'وجبات خفيفة' },
  { id: 'c4', name: 'Meals', nameAr: 'وجبات رئيسية' },
];

export const initialMenuItems: MenuItem[] = [
  { id: 'm1', name: 'Pepsi', nameAr: 'بيبسي', category: 'c2', price: 2, costPrice: 0.8, stock: 48, lowStockThreshold: 10 },
  { id: 'm2', name: 'Water', nameAr: 'ماء', category: 'c2', price: 1, costPrice: 0.3, stock: 60, lowStockThreshold: 15 },
  { id: 'm3', name: 'Coffee', nameAr: 'قهوة', category: 'c1', price: 5, costPrice: 1.5, stock: 30, lowStockThreshold: 5 },
  { id: 'm4', name: 'Tea', nameAr: 'شاي', category: 'c1', price: 3, costPrice: 0.8, stock: 40, lowStockThreshold: 5 },
  { id: 'm5', name: 'Chips', nameAr: 'رقائق', category: 'c3', price: 3, costPrice: 1.2, stock: 35, lowStockThreshold: 8 },
  { id: 'm6', name: 'Sandwich', nameAr: 'ساندويتش', category: 'c4', price: 8, costPrice: 3.5, stock: 12, lowStockThreshold: 5 },
  { id: 'm7', name: 'Burger', nameAr: 'برغر', category: 'c4', price: 12, costPrice: 5, stock: 8, lowStockThreshold: 3 },
  { id: 'm8', name: 'Energy Drink', nameAr: 'مشروب طاقة', category: 'c2', price: 6, costPrice: 2.5, stock: 4, lowStockThreshold: 5 },
  { id: 'm9', name: 'Popcorn', nameAr: 'فشار', category: 'c3', price: 4, costPrice: 1, stock: 20, lowStockThreshold: 6 },
  { id: 'm10', name: 'Lemonade', nameAr: 'عصير ليمون', category: 'c2', price: 4, costPrice: 1.2, stock: 3, lowStockThreshold: 5 },
];

export const initialPricing: PricingConfig[] = [
  { type: 'PS4', singleRate: 3, multiRate: 4 },
  { type: 'PS5', singleRate: 4, multiRate: 5 },
  { type: 'Xbox', singleRate: 3.5, multiRate: 4.5 },
  { type: 'VIP', singleRate: 8, multiRate: 10 },
];

export const initialControllers: Controller[] = [
  { id: 'ctrl1', number: 'C-001', assignedTo: 1, status: 'working' },
  { id: 'ctrl2', number: 'C-002', assignedTo: 1, status: 'working' },
  { id: 'ctrl3', number: 'C-003', assignedTo: 3, status: 'repair' },
  { id: 'ctrl4', number: 'C-004', assignedTo: null, status: 'damaged' },
  { id: 'ctrl5', number: 'C-005', assignedTo: 2, status: 'working' },
  { id: 'ctrl6', number: 'C-006', assignedTo: null, status: 'retired' },
];

export const initialShiftReports: ShiftReport[] = [
  { id: 'sr1', date: '2026-09-10', staff: 'Admin', countedCash: 892.75, expectedCash: 895.5, variance: -2.75, notes: 'Slight shortage, verified receipts.' },
  { id: 'sr2', date: '2026-09-09', staff: 'Cashier', countedCash: 1040, expectedCash: 1040, variance: 0, notes: 'Balanced.' },
  { id: 'sr3', date: '2026-09-08', staff: 'Cashier', countedCash: 765.25, expectedCash: 760, variance: 5.25, notes: 'Extra change from tips jar.' },
  { id: 'sr4', date: '2026-09-07', staff: 'Admin', countedCash: 980, expectedCash: 984.5, variance: -4.5, notes: '' },
];

export const initialMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'mr1',
    date: '2026-09-08',
    targetType: 'console',
    targetId: '6',
    targetLabel: 'Xbox — 02',
    issue: 'HDMI port damaged — replaced',
    cost: 45,
    resolvedBy: 'Ahmed K.',
  },
  {
    id: 'mr2',
    date: '2026-09-05',
    targetType: 'controller',
    targetId: 'ctrl4',
    targetLabel: 'C-004',
    issue: 'Analog stick drift — recalibrated',
    cost: 20,
    resolvedBy: 'Ahmed K.',
  },
  {
    id: 'mr3',
    date: '2026-09-01',
    targetType: 'console',
    targetId: '4',
    targetLabel: 'PS4 — 02',
    issue: 'Overheating — thermal paste replaced',
    cost: 15,
    resolvedBy: 'Mohammed S.',
  },
  {
    id: 'mr4',
    date: '2026-08-28',
    targetType: 'controller',
    targetId: 'ctrl3',
    targetLabel: 'C-003',
    issue: 'USB cable fraying — replaced cable',
    cost: 8,
    resolvedBy: 'Ahmed K.',
  },
];

export const initialCustomers: Customer[] = [
  { id: 'cu1', name: 'Khalid Al-Rashidi', phone: '+966 50 123 4567', balance: 0, creditLimit: 100, tabEnabled: false },
  { id: 'cu2', name: 'Omar Hassan', phone: '+966 55 987 6543', balance: 25, creditLimit: 50, tabEnabled: true },
  { id: 'cu3', name: 'Sara Al-Mansouri', phone: '+966 59 456 7890', balance: 0, tabEnabled: false },
  { id: 'cu4', name: 'Faisal Al-Otaibi', phone: '+966 50 321 0987', balance: 75, creditLimit: 100, tabEnabled: true },
  { id: 'cu5', name: 'Reem Al-Zahrani', phone: '+966 54 789 1230', balance: 12.5, tabEnabled: true },
];

export const initialAuditLog: AuditEntry[] = [
  {
    id: 'a1',
    timestamp: '2026-09-10 14:32:00',
    staff: 'Admin',
    actionType: 'Session Ended',
    details: 'Console PS5-01 — Duration: 1h 20m — Total: $5.33',
  },
  {
    id: 'a2',
    timestamp: '2026-09-10 13:15:00',
    staff: 'Admin',
    actionType: 'Price Changed',
    details: 'PS5 single rate changed: $3.50 → $4.00/hr',
  },
  {
    id: 'a3',
    timestamp: '2026-09-10 12:45:00',
    staff: 'Cashier',
    actionType: 'Sale Completed',
    details: 'Walk-in sale: Coffee ×1, Chips ×2 — Total: $11.00',
  },
  {
    id: 'a4',
    timestamp: '2026-09-10 11:30:00',
    staff: 'Cashier',
    actionType: 'Session Cancelled',
    details: 'Xbox-01 session cancelled at customer request',
  },
  {
    id: 'a5',
    timestamp: '2026-09-10 10:00:00',
    staff: 'Admin',
    actionType: 'Item Deleted',
    details: 'Menu item "Hot Chocolate" removed from catalogue',
  },
  {
    id: 'a6',
    timestamp: '2026-09-09 20:15:00',
    staff: 'Cashier',
    actionType: 'Shift Submitted',
    details: 'Shift handover submitted — Counted: $890.00, Expected: $892.75, Variance: −$2.75',
  },
];
