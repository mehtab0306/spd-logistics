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

const INITIAL_BROKERS: BrokerRecord[] = [
  {
    id: 'brk-101',
    name: 'Haji Qasim Goods Transport & Commission Agency',
    contactPerson: 'Haji Qasim Khan',
    phone: '0300 8472910',
    whatsapp: '0300 8472910',
    cnic: '35202-1928374-1',
    ntn: '4829102-7',
    city: 'Lahore',
    commissionType: 'FIXED',
    commissionRate: 2500,
    openingBalance: 45000,
    bankDetails: 'Habib Bank Ltd (HBL) A/C 0123-7901234567, Badami Bagh Branch',
    notes: 'Specializes in 22-wheeler flatbeds and heavy cargo for Lahore to Karachi corridor.',
    status: 'ACTIVE',
    totalTrips: 4,
    totalFreightAgreed: 380000,
    totalAdvancePaid: 260000,
    totalDeductions: 10000,
    netPayableBalance: 155000,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'brk-102',
    name: 'Karachi Frontier Goods Agency',
    contactPerson: 'Nawabzada Gulzar',
    phone: '0321 9928371',
    whatsapp: '0321 9928371',
    cnic: '42101-8374921-3',
    ntn: '3928172-1',
    city: 'Karachi',
    commissionType: 'PERCENTAGE',
    commissionRate: 5,
    openingBalance: 80000,
    bankDetails: 'Meezan Bank Ltd A/C 0201-9988776655, Mauripur Truck Stand Branch',
    notes: 'Prime supplier for container carriers and long-haul trailer fleet.',
    status: 'ACTIVE',
    totalTrips: 6,
    totalFreightAgreed: 590000,
    totalAdvancePaid: 410000,
    totalDeductions: 15000,
    netPayableBalance: 245000,
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'brk-103',
    name: 'Al-Madina Freight Brokerage',
    contactPerson: 'Chaudhry Akram',
    phone: '0333 5566778',
    whatsapp: '0333 5566778',
    cnic: '37405-7281923-5',
    ntn: '5182930-4',
    city: 'Rawalpindi',
    commissionType: 'FIXED',
    commissionRate: 2000,
    openingBalance: 25000,
    bankDetails: 'United Bank Ltd (UBL) A/C 0987-1234567890, Pirwadhai Branch',
    notes: 'Potohar & Northern corridor fleet supplier (Rawalpindi, Peshawar, Abbottabad).',
    status: 'ACTIVE',
    totalTrips: 3,
    totalFreightAgreed: 210000,
    totalAdvancePaid: 150000,
    totalDeductions: 5000,
    netPayableBalance: 80000,
    createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'brk-104',
    name: 'Chenab Goods Commission Agency',
    contactPerson: 'Mian Tariq',
    phone: '0301 7788990',
    whatsapp: '0301 7788990',
    cnic: '33100-6152439-7',
    ntn: '6271890-2',
    city: 'Faisalabad',
    commissionType: 'FIXED',
    commissionRate: 1800,
    openingBalance: 0,
    bankDetails: 'MCB Bank A/C 1122-3344556677, Jhang Road Branch',
    notes: 'Industrial textile & yarn container transport broker.',
    status: 'ACTIVE',
    totalTrips: 2,
    totalFreightAgreed: 140000,
    totalAdvancePaid: 100000,
    totalDeductions: 0,
    netPayableBalance: 40000,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface CentralStoreData {
  customers: any[];
  bilties: any[];
  challans: any[];
  drivers: any[];
  vehicles: any[];
  brokers: BrokerRecord[];
  cashBooks: any[];
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
          cashBooks: Array.isArray(parsed.cashBooks) ? parsed.cashBooks : [],
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
    cashBooks: [],
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
