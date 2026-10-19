"use client";

/**
 * Dual-Persistence LocalStorage Helper for SPD Logistics
 * Synchronizes both `spd_<entity>` and `spd_local_<entity>` keys
 * so that all pages, dropdowns, tables, and public tracking stay in sync
 * even when Netlify's serverless filesystem is read-only.
 */

function safeParseArray(raw: string | null): any[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function unwrapRecord(item: any, entityKey?: "customer" | "driver" | "vehicle" | "consignment" | "challan"): any {
  if (!item || typeof item !== "object") return null;
  if (entityKey && item[entityKey] && typeof item[entityKey] === "object") {
    return { ...item[entityKey], user: item.user || item[entityKey].user, account: item.account || item[entityKey].account };
  }
  if (item.customer && typeof item.customer === "object" && !item.name) {
    return { ...item.customer, user: item.user || item.customer.user, account: item.account || item.customer.account };
  }
  if (item.driver && typeof item.driver === "object" && !item.name && !item.challanNumber) {
    return { ...item.driver, user: item.user || item.driver.user };
  }
  return item;
}

function readMergedStorage(primaryKey: string, secondaryKey: string, entityKey?: "customer" | "driver" | "vehicle" | "consignment" | "challan"): any[] {
  if (typeof window === "undefined") return [];
  const primary = safeParseArray(localStorage.getItem(primaryKey));
  const secondary = safeParseArray(localStorage.getItem(secondaryKey));
  const seen = new Map<string, any>();

  for (const rawItem of [...primary, ...secondary]) {
    const item = unwrapRecord(rawItem, entityKey);
    if (!item || !item.id) continue;
    const id = String(item.id);
    if (!seen.has(id)) {
      seen.set(id, item);
    } else {
      seen.set(id, { ...seen.get(id), ...item });
    }
  }
  return Array.from(seen.values());
}

function writeDualStorage(primaryKey: string, secondaryKey: string, list: any[]) {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(list);
    localStorage.setItem(primaryKey, serialized);
    localStorage.setItem(secondaryKey, serialized);
  } catch (err) {
    console.warn(`Failed writing to localStorage (${primaryKey}):`, err);
  }
}

function getDeletedIds(deletedKey: string): string[] {
  if (typeof window === "undefined") return [];
  return safeParseArray(localStorage.getItem(deletedKey)).map(String);
}

function addDeletedId(deletedKey: string, id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedIds(deletedKey);
    if (!current.includes(String(id))) {
      current.push(String(id));
      localStorage.setItem(deletedKey, JSON.stringify(current));
    }
  } catch {}
}

function removeDeletedId(deletedKey: string, id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDeletedIds(deletedKey).filter((i) => String(i) !== String(id));
    localStorage.setItem(deletedKey, JSON.stringify(current));
  } catch {}
}

/**
 * Merges local records (placed at the top in order) with API/seed records,
 * deduplicating by `id` (and optional secondary unique key like `biltyNumber` or `challanNumber`).
 */
export function mergeLocalWithApi(
  localList: any[],
  apiList: any[],
  deletedIds: string[] = [],
  uniqueField?: string
): any[] {
  const deletedSet = new Set(deletedIds.map(String));
  const result: any[] = [];
  const idIndexMap = new Map<string, number>();
  const uniqueFieldMap = new Map<string, number>();

  // 1. Add valid local records first (so newly created records stay at the top)
  for (const item of localList) {
    if (!item || !item.id) continue;
    const id = String(item.id);
    if (deletedSet.has(id) || item.status === "DELETED") continue;
    const uVal = uniqueField && item[uniqueField] ? String(item[uniqueField]).toUpperCase() : null;

    if (idIndexMap.has(id)) {
      const idx = idIndexMap.get(id)!;
      result[idx] = { ...result[idx], ...item };
    } else if (uVal && uniqueFieldMap.has(uVal)) {
      const idx = uniqueFieldMap.get(uVal)!;
      result[idx] = { ...result[idx], ...item };
    } else {
      const idx = result.length;
      result.push(item);
      idIndexMap.set(id, idx);
      if (uVal) uniqueFieldMap.set(uVal, idx);
    }
  }

  // 2. Append API/seed records that are not already in localList
  for (const apiItem of apiList || []) {
    if (!apiItem || !apiItem.id) continue;
    const id = String(apiItem.id);
    if (deletedSet.has(id) || apiItem.status === "DELETED") continue;
    const uVal = uniqueField && apiItem[uniqueField] ? String(apiItem[uniqueField]).toUpperCase() : null;

    if (idIndexMap.has(id)) {
      const idx = idIndexMap.get(id)!;
      // Local record overrides API record fields, but keep any missing base fields from API
      result[idx] = { ...apiItem, ...result[idx] };
    } else if (uVal && uniqueFieldMap.has(uVal)) {
      const idx = uniqueFieldMap.get(uVal)!;
      result[idx] = { ...apiItem, ...result[idx] };
    } else {
      const idx = result.length;
      result.push(apiItem);
      idIndexMap.set(id, idx);
      if (uVal) uniqueFieldMap.set(uVal, idx);
    }
  }

  return result;
}

// ==========================================
// 1. CUSTOMERS (`spd_customers` & `spd_local_customers`)
// ==========================================
export const CUSTOMERS_KEY = "spd_customers";
export const LOCAL_CUSTOMERS_KEY = "spd_local_customers";
export const DELETED_CUSTOMERS_KEY = "spd_local_deleted_customers";

export function getStoredCustomers(): any[] {
  const raw = readMergedStorage(CUSTOMERS_KEY, LOCAL_CUSTOMERS_KEY, "customer").filter(
    (c) => c && c.id && c.name
  );

  const result: any[] = [];
  const seenIds = new Set<string>();
  const seenPhones = new Set<string>();
  const seenNames = new Set<string>();

  for (const c of raw) {
    const id = String(c.id);
    if (seenIds.has(id)) continue;

    const normPhone = c.phone ? String(c.phone).replace(/[^0-9]/g, "") : "";
    const normName = c.name ? String(c.name).trim().toLowerCase() : "";

    const phoneDuplicate = normPhone.length >= 7 && seenPhones.has(normPhone);
    const nameDuplicate = normName.length > 1 && seenNames.has(normName);

    if (phoneDuplicate || nameDuplicate) {
      continue;
    }

    seenIds.add(id);
    if (normPhone.length >= 7) seenPhones.add(normPhone);
    if (normName.length > 1) seenNames.add(normName);
    result.push(c);
  }

  // Self-heal storage if duplicates were found and stripped
  if (raw.length !== result.length) {
    writeDualStorage(CUSTOMERS_KEY, LOCAL_CUSTOMERS_KEY, result);
  }

  return result;
}

export function getDeletedCustomerIds(): string[] {
  return getDeletedIds(DELETED_CUSTOMERS_KEY);
}

export function saveStoredCustomer(customer: any): any[] {
  const clean = unwrapRecord(customer, "customer");
  if (!clean || !clean.id) return getStoredCustomers();
  const list = getStoredCustomers();

  const normPhone = clean.phone ? String(clean.phone).replace(/[^0-9]/g, "") : "";
  const normName = clean.name ? String(clean.name).trim().toLowerCase() : "";

  // 1. Match by ID
  let idx = list.findIndex((c) => String(c.id) === String(clean.id));

  // 2. Fallback: match by normalized phone (>= 7 digits)
  if (idx === -1 && normPhone.length >= 7) {
    idx = list.findIndex((c) => {
      const cPhone = c.phone ? String(c.phone).replace(/[^0-9]/g, "") : "";
      return cPhone.length >= 7 && cPhone === normPhone;
    });
  }

  // 3. Fallback: match by normalized name
  if (idx === -1 && normName.length > 1) {
    idx = list.findIndex((c) => {
      const cName = c.name ? String(c.name).trim().toLowerCase() : "";
      return cName.length > 1 && cName === normName;
    });
  }

  if (idx >= 0) {
    // Preserve existing ID while updating fields
    list[idx] = { ...list[idx], ...clean, id: list[idx].id };
  } else {
    list.unshift(clean);
  }
  writeDualStorage(CUSTOMERS_KEY, LOCAL_CUSTOMERS_KEY, list);
  return list;
}

export function removeStoredCustomer(id: string, recordToTrash?: any): any[] {
  const current = getStoredCustomers();
  const target = recordToTrash || current.find((c) => String(c.id) === String(id));
  if (target) {
    moveToTrash("customer", target);
  }
  const list = current.filter((c) => String(c.id) !== String(id));
  writeDualStorage(CUSTOMERS_KEY, LOCAL_CUSTOMERS_KEY, list);
  addDeletedId(DELETED_CUSTOMERS_KEY, id);
  return list;
}

// ==========================================
// 2. BILTIES (`spd_bilties` & `spd_local_bilties` & `spd_local_tracking`)
// ==========================================
export const BILTIES_KEY = "spd_bilties";
export const LOCAL_BILTIES_KEY = "spd_local_bilties";
export const LOCAL_TRACKING_KEY = "spd_local_tracking";
export const DELETED_BILTIES_KEY = "spd_local_deleted_bilties";

export function getStoredBilties(): any[] {
  const raw = readMergedStorage(BILTIES_KEY, LOCAL_BILTIES_KEY, "consignment").filter(
    (b) => b && (b.id || b.biltyNumber) && !String(b.id || "").startsWith("bilty-demo-")
  );

  const result: any[] = [];
  const seenNos = new Set<string>();

  for (const b of raw) {
    const key = String(b.biltyNumber || b.id || "").trim().toUpperCase();
    if (!key || seenNos.has(key) || b.shipmentStatus === "DELETED") continue;
    seenNos.add(key);
    result.push(b);
  }

  return result;
}

export function getDeletedBiltyIds(): string[] {
  return getDeletedIds(DELETED_BILTIES_KEY);
}

export function saveStoredBilty(bilty: any): any[] {
  const clean = unwrapRecord(bilty, "consignment");
  if (!clean || (!clean.id && !clean.biltyNumber)) return getStoredBilties();

  // Use exact user-entered biltyNumber
  const finalBiltyNo = String(clean.biltyNumber || clean.id).trim();
  clean.id = finalBiltyNo;
  clean.biltyNumber = finalBiltyNo;

  const list = getStoredBilties();
  // Filter out any matching record by biltyNumber or id to prevent duplicates
  const filtered = list.filter(
    (b) =>
      String(b.biltyNumber || "").trim().toUpperCase() !== finalBiltyNo.toUpperCase() &&
      String(b.id || "").trim().toUpperCase() !== finalBiltyNo.toUpperCase()
  );

  // Prepend new/updated bilty to top
  const updated = [clean, ...filtered];

  writeDualStorage(BILTIES_KEY, LOCAL_BILTIES_KEY, updated);

  // Also sync to spd_local_tracking for public & admin tracking
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("spd_bilties", JSON.stringify(updated));
      localStorage.setItem("spd_local_bilties", JSON.stringify(updated));
      localStorage.setItem("bilties", JSON.stringify(updated));
      localStorage.setItem("spd_selected_bilty", JSON.stringify(clean));
      sessionStorage.setItem("last_created_bilty", JSON.stringify(clean));

      const trackingList = safeParseArray(localStorage.getItem(LOCAL_TRACKING_KEY)).filter(
        (t) =>
          String(t.biltyNumber || "").trim().toUpperCase() !== finalBiltyNo.toUpperCase() &&
          String(t.id || "").trim().toUpperCase() !== finalBiltyNo.toUpperCase()
      );
      trackingList.unshift(clean);
      localStorage.setItem(LOCAL_TRACKING_KEY, JSON.stringify(trackingList));
    } catch {}
  }

  return updated;
}

export function removeStoredBilty(id: string, recordToTrash?: any): any[] {
  const current = getStoredBilties();
  const target = recordToTrash || current.find((b) => String(b.id) === String(id));
  if (target) {
    moveToTrash("bilty", target);
  }
  const list = current.filter((b) => String(b.id) !== String(id));
  writeDualStorage(BILTIES_KEY, LOCAL_BILTIES_KEY, list);
  addDeletedId(DELETED_BILTIES_KEY, id);
  return list;
}

// ==========================================
// 3. DRIVERS (`spd_drivers` & `spd_local_drivers`)
// ==========================================
export const DRIVERS_KEY = "spd_drivers";
export const LOCAL_DRIVERS_KEY = "spd_local_drivers";
export const DELETED_DRIVERS_KEY = "spd_local_deleted_drivers";

export function getStoredDrivers(): any[] {
  return readMergedStorage(DRIVERS_KEY, LOCAL_DRIVERS_KEY, "driver").filter(
    (d) => d && d.id && d.name
  );
}

export function getDeletedDriverIds(): string[] {
  return getDeletedIds(DELETED_DRIVERS_KEY);
}

export function saveStoredDriver(driver: any): any[] {
  const clean = unwrapRecord(driver, "driver");
  if (!clean || !clean.id) return getStoredDrivers();
  const list = getStoredDrivers();
  const idx = list.findIndex((d) => String(d.id) === String(clean.id));
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...clean };
  } else {
    list.unshift(clean);
  }
  writeDualStorage(DRIVERS_KEY, LOCAL_DRIVERS_KEY, list);
  return list;
}

export function removeStoredDriver(id: string): any[] {
  const list = getStoredDrivers().filter((d) => String(d.id) !== String(id));
  writeDualStorage(DRIVERS_KEY, LOCAL_DRIVERS_KEY, list);
  addDeletedId(DELETED_DRIVERS_KEY, id);
  return list;
}

// ==========================================
// 4. VEHICLES (`spd_vehicles` & `spd_local_vehicles`)
// ==========================================
export const VEHICLES_KEY = "spd_vehicles";
export const LOCAL_VEHICLES_KEY = "spd_local_vehicles";
export const DELETED_VEHICLES_KEY = "spd_local_deleted_vehicles";

export function getStoredVehicles(): any[] {
  return readMergedStorage(VEHICLES_KEY, LOCAL_VEHICLES_KEY, "vehicle").filter(
    (v) => v && v.id && (v.vehicleNumber || v.registrationNumber)
  );
}

export function getDeletedVehicleIds(): string[] {
  return getDeletedIds(DELETED_VEHICLES_KEY);
}

export function saveStoredVehicle(vehicle: any): any[] {
  const clean = unwrapRecord(vehicle, "vehicle");
  if (!clean || !clean.id) return getStoredVehicles();
  if (!clean.vehicleNumber && clean.registrationNumber) {
    clean.vehicleNumber = clean.registrationNumber;
  }
  if (!clean.registrationNumber && clean.vehicleNumber) {
    clean.registrationNumber = clean.vehicleNumber;
  }
  const list = getStoredVehicles();
  const idx = list.findIndex(
    (v) =>
      String(v.id) === String(clean.id) ||
      (clean.vehicleNumber &&
        String(v.vehicleNumber || v.registrationNumber).toUpperCase() === String(clean.vehicleNumber).toUpperCase())
  );
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...clean };
  } else {
    list.unshift(clean);
  }
  writeDualStorage(VEHICLES_KEY, LOCAL_VEHICLES_KEY, list);
  return list;
}

export function removeStoredVehicle(id: string): any[] {
  const list = getStoredVehicles().filter((v) => String(v.id) !== String(id));
  writeDualStorage(VEHICLES_KEY, LOCAL_VEHICLES_KEY, list);
  addDeletedId(DELETED_VEHICLES_KEY, id);
  return list;
}

// ==========================================
// 5. CHALLANS (`spd_challans` & `spd_local_challans`)
// ==========================================
export const CHALLANS_KEY = "spd_challans";
export const LOCAL_CHALLANS_KEY = "spd_local_challans";
export const DELETED_CHALLANS_KEY = "spd_local_deleted_challans";

export function getStoredChallans(): any[] {
  return readMergedStorage(CHALLANS_KEY, LOCAL_CHALLANS_KEY, "challan").filter(
    (c) => c && c.id && c.challanNumber
  );
}

export function getDeletedChallanIds(): string[] {
  return getDeletedIds(DELETED_CHALLANS_KEY);
}

export function saveStoredChallan(challan: any): any[] {
  const clean = unwrapRecord(challan, "challan");
  if (!clean || !clean.id) return getStoredChallans();
  const list = getStoredChallans();
  const idx = list.findIndex(
    (c) =>
      String(c.id) === String(clean.id) ||
      (clean.challanNumber && String(c.challanNumber).toUpperCase() === String(clean.challanNumber).toUpperCase())
  );
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...clean };
  } else {
    list.unshift(clean);
  }
  writeDualStorage(CHALLANS_KEY, LOCAL_CHALLANS_KEY, list);
  return list;
}

export function removeStoredChallan(id: string, recordToTrash?: any): any[] {
  const current = getStoredChallans();
  const target = recordToTrash || current.find((c) => String(c.id) === String(id));
  if (target) {
    moveToTrash("challan", target);
  }
  const list = current.filter((c) => String(c.id) !== String(id));
  writeDualStorage(CHALLANS_KEY, LOCAL_CHALLANS_KEY, list);
  addDeletedId(DELETED_CHALLANS_KEY, id);
  return list;
}

// ==========================================
// 6. BROKERS (`spd_brokers` & `spd_local_brokers`)
// ==========================================
export const BROKERS_KEY = "spd_brokers";
export const LOCAL_BROKERS_KEY = "spd_local_brokers";
export const DELETED_BROKERS_KEY = "spd_local_deleted_brokers";

export function getStoredBrokers(): any[] {
  return readMergedStorage(BROKERS_KEY, LOCAL_BROKERS_KEY).filter(
    (b) => b && b.id && b.name
  );
}

export function getDeletedBrokerIds(): string[] {
  return getDeletedIds(DELETED_BROKERS_KEY);
}

export function saveStoredBroker(broker: any): any[] {
  if (!broker || !broker.id) return getStoredBrokers();
  const list = getStoredBrokers();
  const idx = list.findIndex(
    (b) =>
      String(b.id) === String(broker.id) ||
      (broker.name && String(b.name).toLowerCase().trim() === String(broker.name).toLowerCase().trim())
  );
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...broker };
  } else {
    list.unshift(broker);
  }
  writeDualStorage(BROKERS_KEY, LOCAL_BROKERS_KEY, list);
  return list;
}

export function removeStoredBroker(id: string): any[] {
  const list = getStoredBrokers().filter((b) => String(b.id) !== String(id));
  writeDualStorage(BROKERS_KEY, LOCAL_BROKERS_KEY, list);
  addDeletedId(DELETED_BROKERS_KEY, id);
  return list;
}

// ==========================================
// 7. DELIVERIES (`spd_deliveries` & `spd_local_deliveries`)
// ==========================================
export const DELIVERIES_KEY = "spd_deliveries";
export const LOCAL_DELIVERIES_KEY = "spd_local_deliveries";

export function getStoredDeliveries(): any[] {
  return readMergedStorage(DELIVERIES_KEY, LOCAL_DELIVERIES_KEY, "consignment").filter(
    (d) => d && (d.id || d.biltyNumber || d.challanNumber)
  );
}

export function saveStoredDelivery(deliveryItem: any): any[] {
  if (!deliveryItem) return getStoredDeliveries();
  const cleanId = String(deliveryItem.id || deliveryItem.biltyNumber || `del-${Date.now()}`);
  const list = getStoredDeliveries();
  const idx = list.findIndex(
    (d) =>
      String(d.id) === cleanId ||
      (d.biltyNumber && deliveryItem.biltyNumber && String(d.biltyNumber).toUpperCase() === String(deliveryItem.biltyNumber).toUpperCase())
  );
  const normalized = { ...deliveryItem, id: cleanId };
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...normalized };
  } else {
    list.unshift(normalized);
  }
  writeDualStorage(DELIVERIES_KEY, LOCAL_DELIVERIES_KEY, list);
  return list;
}

export function removeStoredDelivery(id: string): any[] {
  const list = getStoredDeliveries().filter((d) => String(d.id) !== String(id) && String(d.biltyNumber) !== String(id));
  writeDualStorage(DELIVERIES_KEY, LOCAL_DELIVERIES_KEY, list);
  return list;
}

// ==========================================
// 8. UNIVERSAL CROSS-DEVICE SERVER SYNC
// ==========================================
let isSyncing = false;

export async function syncWithServer(): Promise<void> {
  if (typeof window === "undefined" || isSyncing) return;
  isSyncing = true;

  try {
    const res = await fetch("/api/admin/sync", { cache: "no-store" });
    if (!res.ok) return;
    const { data } = await res.json();
    if (!data || typeof data !== "object") return;

    // 1. Merge server brokers into client
    if (Array.isArray(data.brokers) && data.brokers.length > 0) {
      const localBrokers = getStoredBrokers();
      const merged = mergeLocalWithApi(localBrokers, data.brokers, getDeletedBrokerIds());
      writeDualStorage(BROKERS_KEY, LOCAL_BROKERS_KEY, merged);
    }

    // 2. Merge server customers into client
    if (Array.isArray(data.customers) && data.customers.length > 0) {
      const localCust = getStoredCustomers();
      const merged = mergeLocalWithApi(localCust, data.customers, getDeletedCustomerIds());
      writeDualStorage(CUSTOMERS_KEY, LOCAL_CUSTOMERS_KEY, merged);
    }

    // 3. Merge server bilties into client
    if (Array.isArray(data.bilties) && data.bilties.length > 0) {
      const localBilties = getStoredBilties();
      const merged = mergeLocalWithApi(localBilties, data.bilties, getDeletedBiltyIds(), "biltyNumber");
      writeDualStorage(BILTIES_KEY, LOCAL_BILTIES_KEY, merged);
    }

    // 4. Merge server challans into client
    if (Array.isArray(data.challans) && data.challans.length > 0) {
      const localChallans = getStoredChallans();
      const merged = mergeLocalWithApi(localChallans, data.challans, getDeletedChallanIds(), "challanNumber");
      writeDualStorage(CHALLANS_KEY, LOCAL_CHALLANS_KEY, merged);
    }

    // 5. Merge server drivers into client
    if (Array.isArray(data.drivers) && data.drivers.length > 0) {
      const localDrivers = getStoredDrivers();
      const merged = mergeLocalWithApi(localDrivers, data.drivers, getDeletedDriverIds(), "cnic");
      writeDualStorage(DRIVERS_KEY, LOCAL_DRIVERS_KEY, merged);
    }

    // 6. Merge server vehicles into client
    if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
      const localVehicles = getStoredVehicles();
      const merged = mergeLocalWithApi(localVehicles, data.vehicles, getDeletedVehicleIds(), "vehicleNumber");
      writeDualStorage(VEHICLES_KEY, LOCAL_VEHICLES_KEY, merged);
    }

    window.dispatchEvent(new CustomEvent("spd-sync-completed", { detail: data }));
  } catch (err) {
    console.warn("Background server sync skipped:", err);
  } finally {
    isSyncing = false;
  }
}

// ==========================================
// 8. RECYCLE BIN / RECOVERY STORE (`spd_trash_items`)
// ==========================================
export const TRASH_KEY = "spd_trash_items";

export interface TrashItem {
  id: string;
  type: "bilty" | "challan" | "customer";
  title: string;
  party: string;
  deletedAt: string;
  amount?: number;
  data: any;
}

const DEFAULT_TRASH_SEEDS: TrashItem[] = [];

export function getTrashItems(): TrashItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(TRASH_KEY);
  if (!raw) {
    localStorage.setItem(TRASH_KEY, JSON.stringify([]));
    return [];
  }
  const parsed = safeParseArray(raw);
  return parsed.length > 0 ? parsed : [];
}

export function moveToTrash(type: "bilty" | "challan" | "customer", item: any): TrashItem[] {
  if (!item || !item.id) return getTrashItems();
  const trash = getTrashItems();
  const id = String(item.id);

  let title = "";
  let party = "";
  let amount = 0;

  if (type === "bilty") {
    title = `Bilty #${item.biltyNumber || item.trackingId || id}`;
    party = `${item.origin || "Origin"} → ${item.destination || "Destination"} (${item.senderName || "Sender"})`;
    amount = Number(item.freight || item.totalAmount || 0);
  } else if (type === "challan") {
    title = `Challan #${item.challanNumber || id}`;
    party = `Truck: ${item.truckNumber || "N/A"} • Driver: ${item.driverName || "N/A"}`;
    amount = Number(item.totalAmount || item.truckFreight || 0);
  } else if (type === "customer") {
    title = item.name || item.companyName || `Customer #${id}`;
    party = `${item.city || "Pakistan"} • ${item.phone || item.mobile || "No phone"}`;
    amount = Number(item.balance || item.outstandingBalance || 0);
  }

  const trashRecord: TrashItem = {
    id,
    type,
    title,
    party,
    deletedAt: new Date().toISOString(),
    amount,
    data: {
      ...item,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    },
  };

  const existingIdx = trash.findIndex((t) => String(t.id) === id);
  if (existingIdx >= 0) {
    trash[existingIdx] = trashRecord;
  } else {
    trash.unshift(trashRecord);
  }

  if (typeof window === "undefined") return trash;
  try {
    localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
    window.dispatchEvent(new CustomEvent("spd-trash-updated", { detail: { action: "trash", item: trashRecord } }));
  } catch {}

  return trash;
}

export function restoreFromTrash(id: string): { success: boolean; item?: TrashItem; message: string } {
  const trash = getTrashItems();
  const found = trash.find((t) => String(t.id) === String(id));
  if (!found) {
    return { success: false, message: "Record not found in recycle bin." };
  }

  const cleanData = { ...found.data };
  delete cleanData.isDeleted;
  delete cleanData.deletedAt;

  if (found.type === "bilty") {
    removeDeletedId(DELETED_BILTIES_KEY, found.id);
    saveStoredBilty(cleanData);
  } else if (found.type === "customer") {
    removeDeletedId(DELETED_CUSTOMERS_KEY, found.id);
    saveStoredCustomer(cleanData);
  } else if (found.type === "challan") {
    removeDeletedId(DELETED_CHALLANS_KEY, found.id);
    saveStoredChallan(cleanData);
  }

  const updatedTrash = trash.filter((t) => String(t.id) !== String(id));
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TRASH_KEY, JSON.stringify(updatedTrash));
      window.dispatchEvent(new CustomEvent("spd-trash-updated", { detail: { action: "restore", id } }));
    } catch {}
  }

  return { success: true, item: found, message: `Successfully restored ${found.title} to active records.` };
}

export function permanentlyDeleteFromTrash(id: string): TrashItem[] {
  const trash = getTrashItems();
  const target = trash.find((t) => String(t.id) === String(id));
  const updated = trash.filter((t) => String(t.id) !== String(id));

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(TRASH_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("spd-trash-updated", { detail: { action: "purge", id } }));
    } catch {}

    if (target) {
      try {
        if (target.type === "bilty") {
          fetch(`/api/admin/bilty?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
        } else if (target.type === "customer") {
          fetch(`/api/admin/customers?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
        } else if (target.type === "challan") {
          fetch(`/api/admin/challan?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
        }
      } catch {}
    }
  }

  return updated;
}

export function emptyTrash(): TrashItem[] {
  if (typeof window !== "undefined") {
    localStorage.setItem(TRASH_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("spd-trash-updated", { detail: { action: "empty" } }));
  }
  return [];
}

