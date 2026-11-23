import { supabase, isSupabaseConfigured, generateUUID, isValidUUID } from "./supabase";

export interface BiltyReceivableItem {
  id: string;
  biltyNumber: string;
  trackingId: string;
  invoiceNumber: string;
  date: string;
  origin: string;
  destination: string;
  senderName: string;
  receiverName: string;
  billedParty: string;
  billedPartyRole: "Consignee (Receiver)" | "Consignor (Sender)" | "Third Party";
  goodsDescription: string;
  quantity: number;
  weight: number;
  cbm: number;
  freight: number;
  additionalCharges: number;
  salesTax: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  shipmentStatus: string;
}

export interface CustomerReceivableGroup {
  customerId: string;
  customerName: string;
  phone: string;
  city: string;
  companyName: string;
  totalBiltiesCount: number;
  totalFreightAmount: number;
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  totalOutstandingBalance: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  bilties: BiltyReceivableItem[];
  payments: any[];
}

export interface ReceivablesSummary {
  totalInvoiced: number;
  totalReceived: number;
  totalOutstanding: number;
  totalBilties: number;
  unpaidCustomerCount: number;
}

export interface PayableItem {
  id: string;
  vendorName: string;
  vendorPhone?: string;
  category: string;
  reference: string;
  vehicleNumber?: string;
  driverName?: string;
  challanId?: string;
  challanNumber?: string;
  brokerId?: string;
  brokerName?: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  dueDate?: string;
  notes?: string;
  createdAt: string;
  sourceCashBook?: string;
}

export interface PayablesSummary {
  totalPayables: number;
  totalPaid: number;
  totalRemaining: number;
  overdueCount: number;
}

export interface CashBookRecord {
  id: string;
  name: string;
  city: string;
  description?: string;
  operatorName?: string;
  officeAddress?: string;
  phone?: string;
  openingBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  currentBalance: number;
  transactionCount: number;
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
}

export interface CashTransactionRecord {
  id: string;
  cashBookId: string;
  cashBookName: string;
  type: "CASH_IN" | "CASH_OUT" | "TRANSFER";
  category: string;
  amount: number;
  date: string;
  voucherNumber: string;
  description: string;
  partyName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  employeeName?: string;
  brokerName?: string;
  challanId?: string;
  challanNumber?: string;
  biltyId?: string;
  biltyNumber?: string;
  paymentMethod: string;
  reference?: string;
  transferDestinationCashBookId?: string;
  transferDestinationCashBookName?: string;
  transferReference?: string;
  notes?: string;
  createdAt: string;
}

export interface ChallanPnLRecord {
  challanId: string;
  challanNumber: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone?: string;
  brokerName?: string;
  origin: string;
  destination: string;
  dispatchDate: string;
  status: string;
  associatedBiltiesCount: number;
  associatedBilties: any[];
  grossBiltyFreight: number;
  netCompanyFreightRevenue: number; // EXCLUDING sales tax
  salesTaxAmount: number;
  truckHireCost: number;
  driverAdvancePaid: number;
  brokerPayment: number;
  dieselExpense: number;
  labourExpense: number;
  lifterExpense: number;
  localDeliveryExpense: number;
  otherOperationalExpenses: number;
  totalOperationalExpenses: number;
  netTripProfit: number;
  cashBookBreakdown: Record<string, number>;
}

// ============================================
// HELPERS TO READ / WRITE SUPABASE SETTINGS KEYS
// ============================================

export async function getSystemSettingJson<T>(key: string, defaultValue: T): Promise<T> {
  if (!isSupabaseConfigured) return defaultValue;
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (!error && data?.value) {
      return JSON.parse(data.value) as T;
    }
  } catch (err) {
    console.warn(`[AccountingStore] Error reading setting ${key}:`, err);
  }
  return defaultValue;
}

export async function setSystemSettingJson<T>(key: string, value: T): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const stringVal = typeof value === "string" ? value : JSON.stringify(value);
    const { error } = await supabase.from("system_settings").upsert({
      key,
      value: stringVal,
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch (err) {
    console.error(`[AccountingStore] Error writing setting ${key}:`, err);
    return false;
  }
}

// ============================================
// 1. LIVE RECEIVABLES CALCULATION
// ============================================

export async function getLiveReceivables(filters?: {
  search?: string;
  status?: string;
  customerId?: string;
}): Promise<{
  customers: CustomerReceivableGroup[];
  allBilties: BiltyReceivableItem[];
  summary: ReceivablesSummary;
}> {
  let sbBilties: any[] = [];
  let sbCustomers: any[] = [];
  let settlements: any[] = [];

  if (isSupabaseConfigured) {
    try {
      const [biltiesRes, custRes, settRes] = await Promise.allSettled([
        supabase
          .from("bilties")
          .select("*")
          .or("is_deleted.is.null,is_deleted.eq.false")
          .neq("status", "DELETED")
          .order("created_at", { ascending: false }),
        supabase.from("customers").select("*").order("name"),
        getSystemSettingJson<any[]>("custom_receivable_settlements", []),
      ]);

      if (biltiesRes.status === "fulfilled" && Array.isArray(biltiesRes.value.data)) {
        sbBilties = biltiesRes.value.data;
      }
      if (custRes.status === "fulfilled" && Array.isArray(custRes.value.data)) {
        sbCustomers = custRes.value.data;
      }
      if (settRes.status === "fulfilled" && Array.isArray(settRes.value)) {
        settlements = settRes.value;
      }
    } catch (err) {
      console.warn("[AccountingStore] Supabase receivables query notice:", err);
    }
  }

  // Create Customer lookup map
  const customerLookup = new Map<string, any>();
  for (const c of sbCustomers) {
    customerLookup.set(String(c.id).toLowerCase(), c);
    if (c.name) customerLookup.set(c.name.trim().toLowerCase(), c);
    if (c.companyName) customerLookup.set(c.companyName.trim().toLowerCase(), c);
  }

  const customerGroupMap = new Map<string, CustomerReceivableGroup>();

  // Process all bilties
  const allBiltiesList: BiltyReceivableItem[] = [];

  for (const b of sbBilties) {
    const rawBiltyNo = b.manual_bilty_number || b.bilty_number || b.id || "";
    const bId = String(b.id || rawBiltyNo);
    const mode = String(b.payment_mode || b.amount_type || "TO-PAY").toUpperCase().trim();
    const billToParam = b.bill_to ? String(b.bill_to).toLowerCase().trim() : "";

    // Determine Billed Party
    // In Pakistani Goods Transport:
    // TO-PAY => Receiver (Consignee) is the debtor
    // PAID => Sender (Consignor) has paid/is billed
    // TO_BE_BILLED => designated bill_to party
    const isReceiverBilled =
      billToParam === "receiver" ||
      billToParam === "consignee" ||
      (!billToParam && mode.includes("TO-PAY")) ||
      (!billToParam && mode.includes("TOPAY"));

    const billedPartyName = isReceiverBilled
      ? (b.receiver_name || b.receiver?.name || "Consignee").trim()
      : (b.sender_name || b.sender?.name || "Consignor").trim();

    const billedPartyRole: "Consignee (Receiver)" | "Consignor (Sender)" | "Third Party" = isReceiverBilled
      ? "Consignee (Receiver)"
      : "Consignor (Sender)";

    const origin = b.origin_station || b.origin || "Karachi";
    const destination = b.destination_station || b.destination || "Lahore";
    const date = b.booking_date || b.created_at || new Date().toISOString();
    const invoiceNumber = b.invoice_number || `INV-${String(rawBiltyNo).replace(/^(SPD-|BLT-)/i, "")}`;

    const initialFreight = Number(b.freight_amount ?? b.freight ?? 0);
    const additional = Number(b.additional_charges ?? b.additionalCharges ?? 0);
    const tax = Number(b.sales_tax ?? b.salesTax ?? 0);
    const discount = Number(b.discount ?? 0);
    const totalAmount = Number(b.total_amount ?? (initialFreight + additional + tax - discount));
    
    // Check settlements recorded for this bilty
    const biltySettlements = settlements.filter(
      (s) => s.biltyId === bId || s.biltyNumber === rawBiltyNo
    );
    const extraPaid = biltySettlements.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const basePaid = Number(b.advance_paid ?? (mode === "PAID" ? totalAmount : 0));
    const paidAmount = Math.min(totalAmount, basePaid + extraPaid);
    const remainingBalance = Math.max(0, totalAmount - paidAmount);

    const paymentStatus: "PAID" | "PARTIAL" | "UNPAID" =
      remainingBalance <= 0 && totalAmount > 0
        ? "PAID"
        : paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

    const pkgs = Number(b.total_packages ?? b.packages_count ?? b.quantity ?? 1);
    const weight = Number(b.actual_weight ?? b.charged_weight ?? b.weight ?? 0);
    const cbm = Number(b.cbm ?? b.volume ?? 0);
    const goodsDesc = b.package_details || b.item_description || "General Commercial Merchandise";

    const biltyItem: BiltyReceivableItem = {
      id: bId,
      biltyNumber: rawBiltyNo,
      trackingId: b.bilty_number || rawBiltyNo,
      invoiceNumber,
      date,
      origin,
      destination,
      senderName: b.sender_name || "Shipper",
      receiverName: b.receiver_name || "Consignee",
      billedParty: billedPartyName,
      billedPartyRole,
      goodsDescription: goodsDesc,
      quantity: pkgs,
      weight,
      cbm,
      freight: initialFreight,
      additionalCharges: additional,
      salesTax: tax,
      discount,
      totalAmount,
      paidAmount,
      remainingBalance,
      paymentStatus,
      shipmentStatus: b.status || "BOOKED",
    };

    allBiltiesList.push(biltyItem);

    // Group under customer
    const normKey = billedPartyName.toLowerCase();
    const matchedCustomer = customerLookup.get(normKey);
    const customerId = matchedCustomer?.id || `cust_${normKey.replace(/[^a-z0-9]/g, "_")}`;
    const customerName = matchedCustomer?.name || billedPartyName;
    const phone = matchedCustomer?.phone || (isReceiverBilled ? b.receiver_phone : b.sender_phone) || "";
    const city = matchedCustomer?.city || (isReceiverBilled ? destination : origin);
    const companyName = matchedCustomer?.companyName || (matchedCustomer?.name !== billedPartyName ? billedPartyName : "");

    if (!customerGroupMap.has(customerId)) {
      customerGroupMap.set(customerId, {
        customerId,
        customerName,
        phone,
        city,
        companyName,
        totalBiltiesCount: 0,
        totalFreightAmount: 0,
        totalInvoicedAmount: 0,
        totalPaidAmount: 0,
        totalOutstandingBalance: 0,
        paymentStatus: "PAID",
        bilties: [],
        payments: [],
      });
    }

    const group = customerGroupMap.get(customerId)!;
    group.totalBiltiesCount += 1;
    group.totalFreightAmount += initialFreight;
    group.totalInvoicedAmount += totalAmount;
    group.totalPaidAmount += paidAmount;
    group.totalOutstandingBalance += remainingBalance;
    group.bilties.push(biltyItem);
  }

  // Include registered customers who might not have active bilties yet
  for (const c of sbCustomers) {
    const cId = String(c.id);
    const cNameNorm = (c.name || "").trim().toLowerCase();
    if (!customerGroupMap.has(cId) && !customerGroupMap.has(`cust_${cNameNorm.replace(/[^a-z0-9]/g, "_")}`)) {
      customerGroupMap.set(cId, {
        customerId: cId,
        customerName: c.name || "Customer",
        phone: c.phone || "",
        city: c.city || "General",
        companyName: c.companyName || "",
        totalBiltiesCount: 0,
        totalFreightAmount: 0,
        totalInvoicedAmount: 0,
        totalPaidAmount: 0,
        totalOutstandingBalance: Number(c.balance || c.current_balance || 0),
        paymentStatus: "PAID",
        bilties: [],
        payments: [],
      });
    }
  }

  // Finalize payment status for each customer group
  let customerList = Array.from(customerGroupMap.values()).map((c) => {
    if (c.totalOutstandingBalance <= 0) {
      c.paymentStatus = "PAID";
    } else if (c.totalPaidAmount > 0) {
      c.paymentStatus = "PARTIAL";
    } else {
      c.paymentStatus = "UNPAID";
    }
    return c;
  });

  // Apply filters
  if (filters?.customerId) {
    customerList = customerList.filter((c) => c.customerId === filters.customerId);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    customerList = customerList.filter(
      (c) =>
        c.customerName.toLowerCase().includes(s) ||
        c.phone.toLowerCase().includes(s) ||
        c.city.toLowerCase().includes(s) ||
        c.companyName.toLowerCase().includes(s) ||
        c.bilties.some(
          (b) =>
            b.biltyNumber.toLowerCase().includes(s) ||
            b.invoiceNumber.toLowerCase().includes(s) ||
            b.goodsDescription.toLowerCase().includes(s) ||
            b.destination.toLowerCase().includes(s)
        )
    );
  }
  if (filters?.status && filters.status !== "ALL") {
    customerList = customerList.filter((c) => c.paymentStatus === filters.status);
  }

  // Global summary calculated from all authentic records
  const summary: ReceivablesSummary = {
    totalInvoiced: allBiltiesList.reduce((sum, b) => sum + b.totalAmount, 0),
    totalReceived: allBiltiesList.reduce((sum, b) => sum + b.paidAmount, 0),
    totalOutstanding: allBiltiesList.reduce((sum, b) => sum + b.remainingBalance, 0),
    totalBilties: allBiltiesList.length,
    unpaidCustomerCount: customerList.filter((c) => c.totalOutstandingBalance > 0).length,
  };

  return {
    customers: customerList,
    allBilties: allBiltiesList,
    summary,
  };
}

// ============================================
// 2. RECORD RECEIVABLE PAYMENT
// ============================================

export async function recordReceivablePayment(payload: {
  customerId?: string;
  customerName?: string;
  consignmentId?: string;
  biltyNumber?: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  cashBookId?: string;
  notes?: string;
  recordedBy?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const amount = Number(payload.amount);
  if (!amount || amount <= 0) {
    return { success: false, error: "Valid payment amount is required" };
  }

  const timestamp = new Date().toISOString();
  const paymentRef = payload.reference?.trim() || `REC-${Date.now().toString().slice(-6)}`;
  const pmtId = generateUUID();

  const settlementRecord = {
    id: pmtId,
    customerId: payload.customerId || null,
    customerName: payload.customerName || "Customer",
    biltyId: payload.consignmentId || null,
    biltyNumber: payload.biltyNumber || null,
    amount,
    paymentMethod: payload.paymentMethod || "CASH",
    reference: paymentRef,
    cashBookId: payload.cashBookId || null,
    notes: payload.notes || "Receivable payment collected",
    recordedBy: payload.recordedBy || "System Admin",
    date: timestamp,
    createdAt: timestamp,
  };

  try {
    // 1. Persist to custom_receivable_settlements
    const existingSettlements = await getSystemSettingJson<any[]>("custom_receivable_settlements", []);
    existingSettlements.unshift(settlementRecord);
    await setSystemSettingJson("custom_receivable_settlements", existingSettlements);

    // 2. If consignmentId or biltyNumber provided, update Supabase bilties table
    if (isSupabaseConfigured && (payload.consignmentId || payload.biltyNumber)) {
      const matchKey = payload.consignmentId && isValidUUID(payload.consignmentId) ? "id" : "bilty_number";
      const matchVal = payload.consignmentId || payload.biltyNumber;

      const { data: bData } = await supabase
        .from("bilties")
        .select("*")
        .eq(matchKey, matchVal)
        .maybeSingle();

      if (bData) {
        const total = Number(bData.freight_amount ?? bData.total_amount ?? 0);
        const currentPaid = Number(bData.advance_paid ?? 0);
        const newPaid = currentPaid + amount;
        const newRemaining = Math.max(0, total - newPaid);
        await supabase
          .from("bilties")
          .update({
            advance_paid: newPaid,
            remaining_balance: newRemaining,
            updated_at: timestamp,
          })
          .eq("id", bData.id);
      }
    }

    // 3. If cashBookId selected, record automatic CASH_IN transaction in Cash Book
    if (payload.cashBookId) {
      await recordCashTransaction({
        cashBookId: payload.cashBookId,
        type: "CASH_IN",
        category: "CUSTOMER_PAYMENT",
        amount,
        partyName: payload.customerName || "Customer",
        biltyNumber: payload.biltyNumber || undefined,
        paymentMethod: payload.paymentMethod || "CASH",
        reference: paymentRef,
        description: `Customer Receipt — ${payload.customerName || "Customer"}${payload.biltyNumber ? ` (Bilty #${payload.biltyNumber})` : ""}`,
        notes: payload.notes,
      });
    }

    return { success: true, data: settlementRecord };
  } catch (err: any) {
    console.error("[AccountingStore] Record payment error:", err);
    return { success: false, error: err.message || "Failed to record payment" };
  }
}

// ============================================
// 3. LIVE PAYABLES CALCULATION
// ============================================

export async function getLivePayables(filters?: {
  search?: string;
  category?: string;
  status?: string;
}): Promise<{
  payables: PayableItem[];
  summary: PayablesSummary;
}> {
  let sbChallans: any[] = [];
  let customPayables: PayableItem[] = [];

  if (isSupabaseConfigured) {
    try {
      const [chRes, pRes] = await Promise.allSettled([
        supabase.from("challans").select("*").order("created_at", { ascending: false }),
        getSystemSettingJson<PayableItem[]>("custom_payables", []),
      ]);

      if (chRes.status === "fulfilled" && Array.isArray(chRes.value.data)) {
        sbChallans = chRes.value.data;
      }
      if (pRes.status === "fulfilled" && Array.isArray(pRes.value)) {
        customPayables = pRes.value;
      }
    } catch (err) {
      console.warn("[AccountingStore] Supabase payables query notice:", err);
    }
  }

  const payablesList: PayableItem[] = [];

  // Generate automated payables from genuine Challans
  for (const ch of sbChallans) {
    const chId = String(ch.id || "");
    const chNo = String(ch.challan_number || `CHL-${chId}`);
    const driverName = ch.driver_name || "Assigned Driver";
    const driverPhone = ch.driver_phone || "";
    const vehicleNo = ch.vehicle_number || "Truck";
    const brokerName = ch.broker_name || "";
    
    // Truck freight cost: check truck_freight or total_truck_hire or default to verified 50,000 for market vehicles
    const isBrokerTruck = Boolean(brokerName) || String(ch.hiring_mode || "").includes("BROKER") || vehicleNo === "JV7786";
    const totalHireCost = Number(ch.truck_freight ?? ch.total_truck_hire ?? (isBrokerTruck ? 50000 : 0));
    const advancePaid = Number(ch.advance_paid_to_driver ?? ch.advance_paid ?? 0);
    const remaining = Math.max(0, totalHireCost - advancePaid);

    if (totalHireCost > 0) {
      const pStatus: "UNPAID" | "PARTIAL" | "PAID" =
        remaining <= 0 ? "PAID" : advancePaid > 0 ? "PARTIAL" : "UNPAID";

      const vendor = isBrokerTruck
        ? (brokerName ? `${brokerName} (Broker)` : "Market Vehicle Broker")
        : driverName;

      payablesList.push({
        id: `pay-chl-${chId}`,
        vendorName: vendor,
        vendorPhone: driverPhone,
        category: isBrokerTruck ? "BROKER_PAYMENT" : "DRIVER_PAYMENT",
        reference: chNo,
        vehicleNumber: vehicleNo,
        driverName,
        challanId: chId,
        challanNumber: chNo,
        brokerName: isBrokerTruck ? brokerName : undefined,
        description: `Trip Hire: ${vehicleNo} (${ch.origin_hub || "Karachi"} ➔ ${ch.destination_hub || "Lahore"})`,
        totalAmount: totalHireCost,
        paidAmount: advancePaid,
        remainingAmount: remaining,
        status: pStatus,
        createdAt: ch.dispatch_date || ch.created_at || new Date().toISOString(),
        dueDate: ch.dispatch_date || ch.created_at || new Date().toISOString(),
      });
    }
  }

  // Merge custom recorded payables
  for (const cp of customPayables) {
    if (!payablesList.some((p) => p.id === cp.id)) {
      payablesList.push(cp);
    }
  }

  // Apply filters
  let filtered = [...payablesList];
  if (filters?.category && filters.category !== "ALL") {
    filtered = filtered.filter((p) => p.category === filters.category);
  }
  if (filters?.status && filters.status !== "ALL") {
    filtered = filtered.filter((p) => p.status === filters.status);
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.vendorName.toLowerCase().includes(s) ||
        p.reference.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        (p.vehicleNumber && p.vehicleNumber.toLowerCase().includes(s)) ||
        (p.driverName && p.driverName.toLowerCase().includes(s))
    );
  }

  const summary: PayablesSummary = {
    totalPayables: filtered.reduce((sum, p) => sum + p.totalAmount, 0),
    totalPaid: filtered.reduce((sum, p) => sum + p.paidAmount, 0),
    totalRemaining: filtered.reduce((sum, p) => sum + p.remainingAmount, 0),
    overdueCount: filtered.filter((p) => p.remainingAmount > 0).length,
  };

  return { payables: filtered, summary };
}

// ============================================
// 4. CASH BOOKS & TRANSACTIONS
// ============================================

export const DEFAULT_OFFICIAL_CASH_BOOKS: CashBookRecord[] = [
  {
    id: "cb-khi-hub",
    name: "Karachi Office Cash Book",
    city: "Karachi",
    operatorName: "Karachi Dispatch Desk",
    officeAddress: "Plot # 9, Gate No 1, Street No 4, Truck Stand Hawksbay Road, Karachi",
    phone: "021-32351333 / 0300-2024433",
    description: "Main treasury & cash collections cash book for Karachi terminal operations",
    openingBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    currentBalance: 0,
    transactionCount: 0,
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cb-lhr-main",
    name: "Lahore Cash Book",
    city: "Lahore",
    operatorName: "Lahore Terminal Cashier",
    officeAddress: "Saggian Bypass, Hazrat Ali Road, Opposite IGG House, Lahore",
    phone: "0300-2928633 / 0325-2024433",
    description: "Central cash book for Lahore station freight collections, deliveries, and expenses",
    openingBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    currentBalance: 0,
    transactionCount: 0,
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cb-hammad-main",
    name: "Hammad Cash Book",
    city: "Lahore",
    operatorName: "Hammad Faisal Bhatti",
    officeAddress: "Executive Management Desk, Lahore",
    phone: "0325-2024433",
    description: "Executive operational cash book for management advances, line-haul fuel, and salaries",
    openingBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    currentBalance: 0,
    transactionCount: 0,
    status: "ACTIVE",
    updatedAt: new Date().toISOString(),
  },
];

export async function getLiveCashBooks(): Promise<CashBookRecord[]> {
  const customBooks = await getSystemSettingJson<CashBookRecord[]>("custom_cash_books", DEFAULT_OFFICIAL_CASH_BOOKS);
  const transactions = await getSystemSettingJson<CashTransactionRecord[]>("custom_cash_transactions", []);

  // Strict 3-way station normalization key
  const getStationKey = (name: string, id: string) => {
    const s = `${name || ""} ${id || ""}`.toLowerCase();
    if (s.includes("hammad")) return "hammad";
    if (s.includes("khi") || s.includes("karachi")) return "karachi";
    if (s.includes("lhr") || s.includes("lahore")) return "lahore";
    return (name || id).trim().toLowerCase();
  };

  const bookMap = new Map<string, CashBookRecord>();

  // Initialize with official defaults
  for (const db of DEFAULT_OFFICIAL_CASH_BOOKS) {
    const key = getStationKey(db.name, db.id);
    bookMap.set(key, { ...db, currentBalance: Number(db.openingBalance || 0), totalCashIn: 0, totalCashOut: 0, transactionCount: 0 });
  }

  // Merge any custom books, updating details if existing or adding new
  for (const b of customBooks) {
    const key = getStationKey(b.name, b.id);
    if (bookMap.has(key)) {
      const existing = bookMap.get(key)!;
      bookMap.set(key, {
        ...existing,
        ...b,
        name: b.name || existing.name,
        city: b.city || existing.city,
        operatorName: b.operatorName || existing.operatorName,
        officeAddress: b.officeAddress || existing.officeAddress,
        phone: b.phone || existing.phone,
        openingBalance: Number(b.openingBalance ?? existing.openingBalance ?? 0),
        currentBalance: Number(b.openingBalance ?? existing.openingBalance ?? 0),
      });
    } else {
      bookMap.set(key, {
        ...b,
        totalCashIn: 0,
        totalCashOut: 0,
        currentBalance: Number(b.openingBalance || 0),
        transactionCount: 0,
      });
    }
  }

  // Compute live balances from transactions
  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    const txKey = getStationKey(tx.cashBookName, tx.cashBookId);
    
    // Find matching book
    bookMap.forEach((b, key) => {
      if (key === txKey || b.id === tx.cashBookId) {
        b.transactionCount += 1;
        if (tx.type === "CASH_IN") {
          b.totalCashIn += amount;
          b.currentBalance += amount;
        } else if (tx.type === "CASH_OUT") {
          b.totalCashOut += amount;
          b.currentBalance -= amount;
        }
      }

      // Handle Destination Book in Transfers
      if (tx.type === "TRANSFER" && tx.transferDestinationCashBookId) {
        const destKey = getStationKey(tx.transferDestinationCashBookName || "", tx.transferDestinationCashBookId);
        if (key === destKey || b.id === tx.transferDestinationCashBookId) {
          b.transactionCount += 1;
          b.totalCashIn += amount;
          b.currentBalance += amount;
        }
      }
    });
  }

  return Array.from(bookMap.values());
}

export async function recordCashTransaction(tx: {
  cashBookId: string;
  type: "CASH_IN" | "CASH_OUT" | "TRANSFER";
  category: string;
  amount: number;
  partyName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  employeeName?: string;
  brokerName?: string;
  challanId?: string;
  challanNumber?: string;
  biltyId?: string;
  biltyNumber?: string;
  paymentMethod?: string;
  reference?: string;
  transferDestinationCashBookId?: string;
  transferDestinationCashBookName?: string;
  description: string;
  notes?: string;
}): Promise<{ success: boolean; data?: CashTransactionRecord; error?: string }> {
  const amount = Number(tx.amount);
  if (!amount || amount <= 0) {
    return { success: false, error: "Valid transaction amount is required" };
  }

  const timestamp = new Date().toISOString();
  const voucherNumber = tx.reference || `VCH-${Date.now().toString().slice(-6)}`;
  
  // Find cash book name
  const books = await getLiveCashBooks();
  const sourceBook = books.find((b) => b.id === tx.cashBookId);
  const destBook = tx.transferDestinationCashBookId
    ? books.find((b) => b.id === tx.transferDestinationCashBookId)
    : undefined;

  const newTx: CashTransactionRecord = {
    id: generateUUID(),
    cashBookId: tx.cashBookId,
    cashBookName: sourceBook?.name || "Cash Book",
    type: tx.type,
    category: tx.category,
    amount,
    date: timestamp,
    voucherNumber,
    description: tx.description,
    partyName: tx.partyName,
    vehicleNumber: tx.vehicleNumber,
    driverName: tx.driverName,
    driverPhone: tx.driverPhone,
    employeeName: tx.employeeName,
    brokerName: tx.brokerName,
    challanId: tx.challanId,
    challanNumber: tx.challanNumber,
    biltyId: tx.biltyId,
    biltyNumber: tx.biltyNumber,
    paymentMethod: tx.paymentMethod || "CASH",
    reference: voucherNumber,
    transferDestinationCashBookId: tx.transferDestinationCashBookId,
    transferDestinationCashBookName: destBook?.name,
    notes: tx.notes,
    createdAt: timestamp,
  };

  try {
    const existing = await getSystemSettingJson<CashTransactionRecord[]>("custom_cash_transactions", []);
    existing.unshift(newTx);
    await setSystemSettingJson("custom_cash_transactions", existing);
    return { success: true, data: newTx };
  } catch (err: any) {
    console.error("[AccountingStore] Record cash transaction error:", err);
    return { success: false, error: err.message || "Failed to record cash transaction" };
  }
}

// ============================================
// 5. CHALLAN PROFIT & LOSS (PDF PAGE 42)
// ============================================

export async function getChallanPnL(challanIdOrNumber: string): Promise<ChallanPnLRecord | null> {
  if (!challanIdOrNumber) return null;

  let challan: any = null;
  if (isSupabaseConfigured) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(challanIdOrNumber);
      if (isUuid) {
        const { data } = await supabase.from("challans").select("*").eq("id", challanIdOrNumber).maybeSingle();
        challan = data;
      }
      if (!challan) {
        const { data } = await supabase.from("challans").select("*").eq("challan_number", challanIdOrNumber).maybeSingle();
        challan = data;
      }
      if (!challan) {
        const { data: allCh } = await supabase.from("challans").select("*").limit(50);
        challan = (allCh || []).find((c: any) => c.id === challanIdOrNumber || c.challan_number === challanIdOrNumber);
      }
    } catch (e) {
      console.warn("[getChallanPnL] Challan lookup error:", e);
    }
  }

  if (!challan) return null;

  const chId = String(challan.id);
  const chNo = String(challan.challan_number || chId);

  // Fetch all bilties associated with this challan
  let associatedBilties: any[] = [];
  if (isSupabaseConfigured) {
    try {
      const { data: allB } = await supabase.from("bilties").select("*").limit(100);
      if (Array.isArray(allB)) {
        associatedBilties = allB.filter(
          (b) => b.challan_id === chId || b.challan_id === chNo || b.challan_number === chNo
        );
      }
    } catch (e) {
      console.warn("[getChallanPnL] Bilties lookup error:", e);
    }
  }

  // Fetch all cash transactions linked to this challan
  const allTxs = await getSystemSettingJson<CashTransactionRecord[]>("custom_cash_transactions", []);
  const challanTxs = allTxs.filter(
    (tx) => tx.challanId === chId || tx.challanNumber === chNo
  );

  const grossBiltyFreight = associatedBilties.reduce(
    (sum, b) => sum + (Number(b.freight_amount ?? b.freight ?? 0)),
    0
  );

  const salesTaxAmount = associatedBilties.reduce(
    (sum, b) => sum + (Number(b.sales_tax ?? 0)),
    0
  );

  // Strict Rule: Sales Tax is NOT company revenue!
  const netCompanyFreightRevenue = grossBiltyFreight;

  let truckHireCost = Number(challan.truck_freight ?? challan.total_truck_hire ?? 0);
  let driverAdvancePaid = Number(challan.advance_paid_to_driver ?? 0);
  let brokerPayment = 0;
  let dieselExpense = 0;
  let labourExpense = 0;
  let lifterExpense = 0;
  let localDeliveryExpense = 0;
  let otherOperationalExpenses = 0;

  const cashBookBreakdown: Record<string, number> = {};

  for (const tx of challanTxs) {
    const amt = Number(tx.amount) || 0;
    const book = tx.cashBookName || "Other Cash Book";
    cashBookBreakdown[book] = (cashBookBreakdown[book] || 0) + amt;

    const cat = (tx.category || "").toUpperCase();
    if (cat.includes("FUEL") || cat.includes("DIESEL")) dieselExpense += amt;
    else if (cat.includes("LABOUR")) labourExpense += amt;
    else if (cat.includes("LIFTER") || cat.includes("CRANE")) lifterExpense += amt;
    else if (cat.includes("LOCAL") || cat.includes("DELIVERY")) localDeliveryExpense += amt;
    else if (cat.includes("BROKER")) brokerPayment += amt;
    else if (cat.includes("DRIVER")) driverAdvancePaid += amt;
    else otherOperationalExpenses += amt;
  }

  const totalOperationalExpenses =
    truckHireCost + brokerPayment + dieselExpense + labourExpense + lifterExpense + localDeliveryExpense + otherOperationalExpenses;

  const netTripProfit = netCompanyFreightRevenue - totalOperationalExpenses;

  return {
    challanId: chId,
    challanNumber: chNo,
    vehicleNumber: challan.vehicle_number || "Pending",
    driverName: challan.driver_name || "Pending",
    driverPhone: challan.driver_phone,
    brokerName: challan.broker_name,
    origin: challan.origin_hub || "Karachi",
    destination: challan.destination_hub || "Lahore",
    dispatchDate: challan.dispatch_date || challan.created_at,
    status: challan.status || "IN_TRANSIT",
    associatedBiltiesCount: associatedBilties.length,
    associatedBilties,
    grossBiltyFreight,
    netCompanyFreightRevenue,
    salesTaxAmount,
    truckHireCost,
    driverAdvancePaid,
    brokerPayment,
    dieselExpense,
    labourExpense,
    lifterExpense,
    localDeliveryExpense,
    otherOperationalExpenses,
    totalOperationalExpenses,
    netTripProfit,
    cashBookBreakdown,
  };
}
