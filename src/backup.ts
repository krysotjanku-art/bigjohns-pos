import { ORDER_HISTORY_KEY } from "./orderHistory";
import { CUSTOM_MENU_KEY, PIZZA_MENU_KEY } from "./pizzaMenu";
import { PIN_KEY, validPin } from "./adminPin";
import { SUSPENDED_ORDERS_KEY } from "./suspendedOrders";

export const RECEIPT_COUNTER_KEY = "bigjohns.receipt-counter";
export const ORDER_COUNTER_KEY = "bigjohns.order-counter";
export const PERSISTENT_POS_KEYS = [ORDER_HISTORY_KEY, RECEIPT_COUNTER_KEY, ORDER_COUNTER_KEY, PIZZA_MENU_KEY, CUSTOM_MENU_KEY, PIN_KEY, SUSPENDED_ORDERS_KEY] as const;
export interface PosBackup { version: 1; exportedAt: string; data: Record<(typeof PERSISTENT_POS_KEYS)[number], string | null>; }
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const createBackup = (storage: Pick<Storage, "getItem">, exportedAt = new Date()): PosBackup => ({ version: 1, exportedAt: exportedAt.toISOString(), data: Object.fromEntries(PERSISTENT_POS_KEYS.map((key) => [key, storage.getItem(key)])) as PosBackup["data"] });
export const backupFilename = (date = new Date()) => `bigjohns-pos-backup-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}-${String(date.getMinutes()).padStart(2, "0")}.json`;

const validCounter = (value: string | null) => value === null || /^\d+$/.test(value);
const validOrderCounter = (value: string | null) => { if (value === null) return true; try { const parsed = JSON.parse(value); return typeof parsed?.date === "string" && Number.isFinite(Number(parsed?.value)); } catch { return false; } };
const validHistory = (value: string | null) => { if (value === null) return true; try { return Array.isArray(JSON.parse(value)); } catch { return false; } };
const validPinValue = (value: string | null) => value === null || validPin(value);
const validSuspendedOrders = (value: string | null) => { if (value === null) return true; try { return Array.isArray(JSON.parse(value)); } catch { return false; } };

export const parseBackup = (text: string): PosBackup | null => {
  try {
    const backup = JSON.parse(text) as PosBackup;
    if (backup?.version !== 1 || typeof backup.exportedAt !== "string" || !Number.isFinite(Date.parse(backup.exportedAt)) || !backup.data || Array.isArray(backup.data)) return null;
    const data={...backup.data,[PIN_KEY]:backup.data[PIN_KEY]??null,[SUSPENDED_ORDERS_KEY]:backup.data[SUSPENDED_ORDERS_KEY]??null} as PosBackup["data"];
    if (!PERSISTENT_POS_KEYS.every((key) => typeof data[key] === "string" || data[key] === null)) return null;
    return validHistory(data[ORDER_HISTORY_KEY]) && validCounter(data[RECEIPT_COUNTER_KEY]) && validOrderCounter(data[ORDER_COUNTER_KEY]) && validPinValue(data[PIN_KEY]) && validSuspendedOrders(data[SUSPENDED_ORDERS_KEY]) ? {...backup,data} : null;
  } catch { return null; }
};

export const restoreBackup = (storage: StorageLike, backup: PosBackup) => PERSISTENT_POS_KEYS.forEach((key) => backup.data[key] === null ? storage.removeItem(key) : storage.setItem(key, backup.data[key]));
