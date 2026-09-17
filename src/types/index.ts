// ============================================
// SPD LOGISTICS — TypeScript Type Definitions
// ============================================

// User types
export interface User {
  id: string;
  email: string;
  username: string | null;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  avatar: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
}

// Customer types
export interface Customer {
  id: string;
  accountId: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  accountType: string;
  status: string;
  notes: string | null;
  openingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

// Account types
export interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  transactions?: AccountTransaction[];
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  date: Date;
  voucherNumber: string | null;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Cash Book types
export interface CashBook {
  id: string;
  name: string;
  city: string | null;
  description: string | null;
  openingBalance: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  transactions?: CashBookTransaction[];
  _count?: {
    transactions: number;
  };
}

export interface CashBookTransaction {
  id: string;
  cashBookId: string;
  date: Date;
  voucherNumber: string | null;
  description: string;
  accountPerson: string | null;
  debit: number;
  credit: number;
  balance: number;
  paymentMethod: string | null;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Consignment / Bilty types
export interface Consignment {
  id: string;
  biltyNumber: string;
  trackingId: string;
  customerId: string | null;
  senderId: string | null;
  receiverId: string | null;
  origin: string;
  destination: string;
  vehicleId: string | null;
  driverId: string | null;
  packageDetails: string | null;
  quantity: number;
  weight: number | null;
  freight: number;
  paymentStatus: string;
  shipmentStatus: string;
  date: Date;
  notes: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  sender?: Customer;
  receiver?: Customer;
  vehicle?: Vehicle;
  driver?: Driver;
  trackingEvents?: TrackingEvent[];
}

export interface TrackingEvent {
  id: string;
  consignmentId: string;
  status: string;
  location: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: Date;
  createdAt: Date;
}

// Vehicle types
export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string | null;
  model: string | null;
  registrationDetails: string | null;
  status: string;
  documents: string | null;
  notes: string | null;
  driverId: string | null;
  createdAt: Date;
  updatedAt: Date;
  driver?: Driver;
}

// Driver types
export interface Driver {
  id: string;
  name: string;
  contact: string | null;
  licenseNumber: string | null;
  status: string;
  documents: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  vehicles?: Vehicle[];
}

// Payment types
export interface Payment {
  id: string;
  type: string;
  customerId: string | null;
  consignmentId: string | null;
  cashBookId: string | null;
  amount: number;
  date: Date;
  paymentMethod: string | null;
  reference: string | null;
  notes: string | null;
  status: string;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer;
  consignment?: Consignment;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: Date;
}

// Audit Log types
export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  module: string;
  recordId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
  user?: User;
}

// Settings types
export interface Setting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Excel Import types
export interface ExcelImport {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number | null;
  module: string;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  status: string;
  errorLog: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalCustomers: number;
  totalConsignments: number;
  totalVehicles: number;
  totalDrivers: number;
  totalPayments: number;
  totalCashBooks: number;
  pendingDeliveries: number;
  activeVehicles: number;
}

// Search & Filter
export interface SearchFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
