import fs from 'fs';
import path from 'path';
import os from 'os';

// Central JSON fallback file path in writable /tmp
const STORE_FILE = path.join(os.tmpdir(), 'spd_central_store.json');

export interface BrokerRecord {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  cnic?: string;
  ntn?: string;
  city: string;
  commissionType: 'FIXED' | 'PERCENTAGE';
  commissionRate: number;
  openingBalance: number; // positive = payable to broker, negative = advance/receivable
  bankDetails?: string;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalTrips?: number;
  totalFreightAgreed?: number;
  totalAdvancePaid?: number;
  totalDeductions?: number;
  netPayableBalance?: number;
  createdAt: string;
  updatedAt?: string;
}

const INITIAL_BROKERS: BrokerRecord[] = [];

export const INITIAL_CASH_BOOKS = [
  {
    id: "cb-lhr-main",
    name: "Lahore Head Office Cash Book",
    city: "Lahore",
    description: "Main central treasury cash book for Lahore terminal operations",
    openingBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
    currentBalance: 0,
    transactionCount: 0,
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cb-khi-hub",
    name: "Karachi Port Terminal Cash Book",
    city: "Karachi",
    description: "Operating cash book for Port Qasim and Mauripur delivery terminal",
    openingBalance: 0,
    totalCredits: 0,
    totalDebits: 0,
    currentBalance: 0,
    transactionCount: 0,
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
  }
];

interface CentralStoreData {
  customers: any[];
  bilties: any[];
  challans: any[];
  drivers: any[];
  vehicles: any[];
  brokers: BrokerRecord[];
  cashBooks: any[];
  cashTransactions: any[];
  brokerPayments: any[];
  lastUpdated: string;
}

// In-memory cache for ultra-fast, zero-IO responses in warm lambda
let memoryStore: CentralStoreData | null = null;

function loadStoreFromFile(): CentralStoreData {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryStore = {
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          bilties: Array.isArray(parsed.bilties) ? parsed.bilties : [],
          challans: Array.isArray(parsed.challans) ? parsed.challans : [],
          drivers: Array.isArray(parsed.drivers) ? parsed.drivers : [],
          vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
          brokers: Array.isArray(parsed.brokers) && parsed.brokers.length > 0 ? parsed.brokers : [...INITIAL_BROKERS],
          cashBooks: Array.isArray(parsed.cashBooks) && parsed.cashBooks.length > 0 ? parsed.cashBooks : [...INITIAL_CASH_BOOKS],
          cashTransactions: Array.isArray(parsed.cashTransactions) ? parsed.cashTransactions : [],
          brokerPayments: Array.isArray(parsed.brokerPayments) ? parsed.brokerPayments : [],
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
        return memoryStore;
      }
    }
  } catch (err) {
    console.warn('[server-store] Warning reading store file:', err);
  }

  // Default initial store
  memoryStore = {
    customers: [],
    bilties: [],
    challans: [],
    drivers: [],
    vehicles: [],
    brokers: [...INITIAL_BROKERS],
    cashBooks: [...INITIAL_CASH_BOOKS],
    cashTransactions: [],
    brokerPayments: [],
    lastUpdated: new Date().toISOString(),
  };

  saveStoreToFile(memoryStore);
  return memoryStore;
}

function saveStoreToFile(data: CentralStoreData) {
  memoryStore = data;
  try {
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[server-store] Warning writing store file:', err);
  }
}

// ============================================
// PUBLIC SERVER STORE METHODS
// ============================================

export function getCentralStore(): CentralStoreData {
  return loadStoreFromFile();
}

export function getCentralCollection<K extends keyof Omit<CentralStoreData, 'lastUpdated'>>(key: K): CentralStoreData[K] {
  const store = loadStoreFromFile();
  return store[key];
}

export function saveCentralRecord<K extends keyof Omit<CentralStoreData, 'lastUpdated'>>(
  collection: K,
  record: any
): any {
  const store = loadStoreFromFile();
  const list = (store[collection] as any[]) || [];
  const idx = list.findIndex(
    (item) =>
      item.id === record.id ||
      (record.biltyNumber && item.biltyNumber === record.biltyNumber) ||
      (record.challanNumber && item.challanNumber === record.challanNumber) ||
      (record.phone && item.phone === record.phone && item.name === record.name)
  );

  const enriched = {
    ...record,
    updatedAt: new Date().toISOString(),
    createdAt: record.createdAt || (idx >= 0 ? list[idx].createdAt : new Date().toISOString()),
  };

  if (idx >= 0) {
    list[idx] = { ...list[idx], ...enriched };
  } else {
    list.unshift(enriched);
  }

  (store[collection] as any[]) = list;
  saveStoreToFile(store);
  return enriched;
}

export function updateCentralRecord<K extends keyof Omit<CentralStoreData, 'lastUpdated'>>(
  collection: K,
  id: string,
  updates: Record<string, any>
): any | null {
  const store = loadStoreFromFile();
  const list = (store[collection] as any[]) || [];
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  list[idx] = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  (store[collection] as any[]) = list;
  saveStoreToFile(store);
  return list[idx];
}

export function deleteCentralRecord<K extends keyof Omit<CentralStoreData, 'lastUpdated'>>(
  collection: K,
  id: string
): boolean {
  const store = loadStoreFromFile();
  const list = (store[collection] as any[]) || [];
  const filtered = list.filter((item) => item.id !== id);
  const changed = filtered.length !== list.length;
  if (changed) {
    (store[collection] as any[]) = filtered;
    saveStoreToFile(store);
  }
  return changed;
}

export function mergeCentralStore(incoming: Partial<CentralStoreData>): CentralStoreData {
  const store = loadStoreFromFile();
  const keys: (keyof Omit<CentralStoreData, 'lastUpdated'>)[] = [
    'customers',
    'bilties',
    'challans',
    'drivers',
    'vehicles',
    'brokers',
    'cashBooks',
    'cashTransactions',
    'brokerPayments',
  ];

  for (const k of keys) {
    if (Array.isArray(incoming[k])) {
      const existing = (store[k] as any[]) || [];
      for (const item of incoming[k]!) {
        const idx = existing.findIndex((e) => e.id === item.id);
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], ...item };
        } else {
          existing.unshift(item);
        }
      }
      (store[k] as any[]) = existing;
    }
  }

  saveStoreToFile(store);
  return store;
}
