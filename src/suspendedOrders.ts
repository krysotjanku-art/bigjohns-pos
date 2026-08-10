import { calculateOrderTotals, type OrderDiscount } from "./discount";
import type { OrderItem } from "./types/menu";

export const SUSPENDED_ORDERS_KEY = "bigjohns.suspended-orders";

export interface SuspendedOrder {
  id: string;
  createdAt: string;
  items: OrderItem[];
  discount: OrderDiscount | null;
  subtotal: number;
  total: number;
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const cloneItems = (items: readonly OrderItem[]) => items.map((item) => ({ ...item, selectedOptions: item.selectedOptions ? [...item.selectedOptions] : undefined }));

export const createSuspendedOrder = (items: readonly OrderItem[], discount: OrderDiscount | null, createdAt = new Date(), id = `${createdAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`): SuspendedOrder => {
  const totals = calculateOrderTotals(items, discount);
  return { id, createdAt: createdAt.toISOString(), items: cloneItems(items), discount: totals.discount, subtotal: totals.subtotal, total: totals.total };
};

const isSuspendedOrder = (value: unknown): value is SuspendedOrder => {
  if (!value || typeof value !== "object") return false;
  const order = value as Partial<SuspendedOrder>;
  return typeof order.id === "string" && typeof order.createdAt === "string" && Number.isFinite(order.subtotal) && Number.isFinite(order.total) && Array.isArray(order.items);
};

export const loadSuspendedOrders = (storage: Pick<Storage, "getItem">): SuspendedOrder[] => {
  try {
    const parsed = JSON.parse(storage.getItem(SUSPENDED_ORDERS_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isSuspendedOrder).sort((left, right) => right.createdAt.localeCompare(left.createdAt)) : [];
  } catch {
    return [];
  }
};

export const saveSuspendedOrders = (storage: StorageLike, orders: readonly SuspendedOrder[]) => storage.setItem(SUSPENDED_ORDERS_KEY, JSON.stringify(orders));
export const addSuspendedOrder = (orders: readonly SuspendedOrder[], order: SuspendedOrder) => [order, ...orders];
export const removeSuspendedOrder = (orders: readonly SuspendedOrder[], id: string) => orders.filter((order) => order.id !== id);
export const restoreSuspendedOrder = (order: SuspendedOrder) => ({ items: cloneItems(order.items), discount: order.discount ? { ...order.discount } : null });
