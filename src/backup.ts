import { ORDER_HISTORY_KEY } from "./orderHistory";
import { PIZZA_MENU_KEY } from "./pizzaMenu";

export const RECEIPT_COUNTER_KEY = "bigjohns.receipt-counter";
export const ORDER_COUNTER_KEY = "bigjohns.order-counter";
export const PERSISTENT_POS_KEYS = [ORDER_HISTORY_KEY, RECEIPT_COUNTER_KEY, ORDER_COUNTER_KEY, PIZZA_MENU_KEY] as const;
export interface PosBackup { version: 1; exportedAt: string; data: Record<(typeof PERSISTENT_POS_KEYS)[number], string | null>; }
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const createBackup = (storage: Pick<Storage, "getItem">, exportedAt = new Date()): PosBackup => ({ version: 1, exportedAt: exportedAt.toISOString(), data: Object.fromEntries(PERSISTENT_POS_KEYS.map((key) => [key, storage.getItem(key)])) as PosBackup["data"] });
export const backupFilename = (date = new Date()) => `bigjohns-pos-backup-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}-${String(date.getMinutes()).padStart(2, "0")}.json`;

const validCounter = (value: string | null) => value === null || /^\d+$/.test(value);
const validOrderCounter = (value: string | null) => { if (value === null) return true; try { const parsed = JSON.parse(value); return typeof parsed?.date === "string" && Number.isFinite(Number(parsed?.value)); } catch { return false; } };
const validHistory = (value: string | null) => { if (value === null) return true; try { return Array.isArray(JSON.parse(value)); } catch { return false; } };

export const parseBackup = (text: string): PosBackup | null => {
  try {
    const backup = JSON.parse(text) as PosBackup;
    if (backup?.version !== 1 || typeof backup.exportedAt !== "string" || !Number.isFinite(Date.parse(backup.exportedAt)) || !backup.data || Array.isArray(backup.data)) return null;
    if (!PERSISTENT_POS_KEYS.every((key) => typeof backup.data[key] === "string" || backup.data[key] === null)) return null;
    return validHistory(backup.data[ORDER_HISTORY_KEY]) && validCounter(backup.data[RECEIPT_COUNTER_KEY]) && validOrderCounter(backup.data[ORDER_COUNTER_KEY]) ? backup : null;
  } catch { return null; }
};

export const restoreBackup = (storage: StorageLike, backup: PosBackup) => PERSISTENT_POS_KEYS.forEach((key) => backup.data[key] === null ? storage.removeItem(key) : storage.setItem(key, backup.data[key]));
