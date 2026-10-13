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
  return readMergedStorage(CUSTOMERS_KEY, LOCAL_CUSTOMERS_KEY, "customer").filter(
    (c) => c && c.id && c.name
  );
}

export function getDeletedCustomerIds(): string[] {
  return getDeletedIds(DELETED_CUSTOMERS_KEY);
}

export function saveStoredCustomer(customer: any): any[] {
  const clean = unwrapRecord(customer, "customer");
  if (!clean || !clean.id) return getStoredCustomers();
  const list = getStoredCustomers();
  const idx = list.findIndex((c) => String(c.id) === String(clean.id));
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...clean };
  } else {
    list.unshift(clean);
  }
  writeDualStorage(CUSTOMERS_KEY, LOCAL_CUSTOMERS_KEY, list);
  return list;
}

export function removeStoredCustomer(id: string): any[] {
  const list = getStoredCustomers().filter((c) => String(c.id) !== String(id));
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
  return readMergedStorage(BILTIES_KEY, LOCAL_BILTIES_KEY, "consignment").filter(
    (b) => b && b.id && b.biltyNumber
  );
}

export function getDeletedBiltyIds(): string[] {
  return getDeletedIds(DELETED_BILTIES_KEY);
}

export function saveStoredBilty(bilty: any): any[] {
  const clean = unwrapRecord(bilty, "consignment");
  if (!clean || !clean.id) return getStoredBilties();
  const list = getStoredBilties();
  const idx = list.findIndex(
    (b) =>
      String(b.id) === String(clean.id) ||
      (clean.biltyNumber && String(b.biltyNumber).toUpperCase() === String(clean.biltyNumber).toUpperCase())
  );
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...clean };
  } else {
    list.unshift(clean);
  }
  writeDualStorage(BILTIES_KEY, LOCAL_BILTIES_KEY, list);

  // Also sync to spd_local_tracking for public & admin tracking
  if (typeof window !== "undefined") {
    try {
      const trackingList = safeParseArray(localStorage.getItem(LOCAL_TRACKING_KEY));
      const tIdx = trackingList.findIndex(
        (t) =>
          String(t.id) === String(clean.id) ||
          (clean.biltyNumber && String(t.biltyNumber).toUpperCase() === String(clean.biltyNumber).toUpperCase())
      );
      if (tIdx >= 0) {
        trackingList[tIdx] = { ...trackingList[tIdx], ...clean };
      } else {
        trackingList.unshift(clean);
      }
      localStorage.setItem(LOCAL_TRACKING_KEY, JSON.stringify(trackingList));
    } catch {}
  }

  return list;
}

export function removeStoredBilty(id: string): any[] {
  const list = getStoredBilties().filter((b) => String(b.id) !== String(id));
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

export function removeStoredChallan(id: string): any[] {
  const list = getStoredChallans().filter((c) => String(c.id) !== String(id));
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
// 7. UNIVERSAL CROSS-DEVICE SERVER SYNC
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

