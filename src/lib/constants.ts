// ============================================
// SPD LOGISTICS — Application Constants
// ============================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'SPD Logistics';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || 'PKR';
export const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₨';

// User Roles
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

// User Status
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

// Customer Account Types
export const ACCOUNT_TYPES = {
  CUSTOMER: 'CUSTOMER',
  SUPPLIER: 'SUPPLIER',
  AGENT: 'AGENT',
  EXPENSE: 'EXPENSE',
  INCOME: 'INCOME',
  OTHER: 'OTHER',
} as const;

// Cash Book Status
export const CASH_BOOK_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  CLOSED: 'CLOSED',
} as const;

// Payment Types
export const PAYMENT_TYPES = {
  RECEIVED: 'RECEIVED',
  MADE: 'MADE',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  BANK: 'BANK',
  CHEQUE: 'CHEQUE',
  ONLINE: 'ONLINE',
  OTHER: 'OTHER',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

// Shipment Status (ordered by workflow)
export const SHIPMENT_STATUS = {
  BOOKED: 'BOOKED',
  BOOKING_RECEIVED: 'BOOKING_RECEIVED',
  PICKED_UP: 'PICKED_UP',
  PROCESSING: 'PROCESSING',
  VEHICLE_ASSIGNED: 'VEHICLE_ASSIGNED',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED_AT_DESTINATION: 'ARRIVED_AT_DESTINATION',
  ON_THE_WAY: 'ON_THE_WAY',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  ON_HOLD: 'ON_HOLD',
  DELIVERY_FAILED: 'DELIVERY_FAILED',
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
} as const;

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  BOOKED: 'Booked',
  BOOKING_RECEIVED: 'Booked',
  PICKED_UP: 'Picked Up',
  PROCESSING: 'Processing',
  VEHICLE_ASSIGNED: 'Vehicle Assigned',
  DRIVER_ASSIGNED: 'Driver Assigned',
  IN_TRANSIT: 'In Transit',
  ARRIVED_AT_DESTINATION: 'Arrived at Destination',
  ON_THE_WAY: 'On The Way',
  OUT_FOR_DELIVERY: 'Out For Delivery',
  DELIVERED: 'Delivered',
  ON_HOLD: 'On Hold',
  DELIVERY_FAILED: 'Delivery Failed',
  RETURNED: 'Returned',
  CANCELLED: 'Cancelled',
};

export const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  BOOKED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  BOOKING_RECEIVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PICKED_UP: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400',
  PROCESSING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  VEHICLE_ASSIGNED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  DRIVER_ASSIGNED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  IN_TRANSIT: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  ARRIVED_AT_DESTINATION: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  ON_THE_WAY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  OUT_FOR_DELIVERY: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  ON_HOLD: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  DELIVERY_FAILED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  RETURNED: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

// Vehicle Types
export const VEHICLE_TYPES = {
  TRUCK: 'TRUCK',
  TRAILER: 'TRAILER',
  VAN: 'VAN',
  PICKUP: 'PICKUP',
  CONTAINER: 'CONTAINER',
  OTHER: 'OTHER',
} as const;

// Vehicle Status
export const VEHICLE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  IN_TRANSIT: 'IN_TRANSIT',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
} as const;

// Driver Status
export const DRIVER_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ON_TRIP: 'ON_TRIP',
  OFF_DUTY: 'OFF_DUTY',
  INACTIVE: 'INACTIVE',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  SHIPMENT: 'SHIPMENT',
  PAYMENT: 'PAYMENT',
  SYSTEM: 'SYSTEM',
  ALERT: 'ALERT',
} as const;

// Audit Log Actions
export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  PAYMENT: 'PAYMENT',
  IMPORT: 'IMPORT',
  SETTINGS: 'SETTINGS',
} as const;

// Audit Log Modules
export const AUDIT_MODULES = {
  AUTH: 'AUTH',
  CUSTOMER: 'CUSTOMER',
  ACCOUNT: 'ACCOUNT',
  CASHBOOK: 'CASHBOOK',
  CONSIGNMENT: 'CONSIGNMENT',
  VEHICLE: 'VEHICLE',
  DRIVER: 'DRIVER',
  PAYMENT: 'PAYMENT',
  SETTINGS: 'SETTINGS',
  EXCEL: 'EXCEL',
  USER: 'USER',
} as const;

// Admin Sidebar Navigation
export const ADMIN_NAV_ITEMS = [
  { title: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { title: 'Customers', href: '/admin/customers', icon: 'Users' },
  { title: 'Accounts', href: '/admin/accounts', icon: 'BookOpen' },
  { title: 'Cash Books', href: '/admin/cash-books', icon: 'Wallet' },
  { title: 'Bilty / Consignments', href: '/admin/bilty', icon: 'Package' },
  { title: 'Tracking', href: '/admin/tracking', icon: 'MapPin' },
  { title: 'Vehicles', href: '/admin/vehicles', icon: 'Truck' },
  { title: 'Drivers', href: '/admin/drivers', icon: 'UserCog' },
  { title: 'Payments', href: '/admin/payments', icon: 'CreditCard' },
  { title: 'Receivables', href: '/admin/receivables', icon: 'ArrowDownLeft' },
  { title: 'Payables', href: '/admin/payables', icon: 'ArrowUpRight' },
  { title: 'Reports', href: '/admin/reports', icon: 'BarChart3' },
  { title: 'Notifications', href: '/admin/notifications', icon: 'Bell' },
  { title: 'AI Assistant', href: '/admin/ai-assistant', icon: 'Bot' },
  { title: 'Users', href: '/admin/users', icon: 'Shield' },
  { title: 'Settings', href: '/admin/settings', icon: 'Settings' },
  { title: 'Audit Logs', href: '/admin/audit-logs', icon: 'ClipboardList' },
] as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;
