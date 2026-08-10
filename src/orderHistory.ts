import { calculateVatBreakdown, type ReceiptSnapshot, type VatBreakdown } from "./receiptSnapshot";import type{OrderDiscount}from"./discount";
import type { OrderItem } from "./types/menu";

export const ORDER_HISTORY_KEY = "bigjohns.order-history";

export interface CompletedOrder {
  receiptNumber: number;
  orderNumber: number;
  createdAt: string;
  issuedAt: string;
  items: readonly OrderItem[];
  total: number;
  subtotal:number;
  discount?:OrderDiscount;
  vatBreakdown: readonly VatBreakdown[];
  paymentType: "cash";
  cancelledAt?: string;
}

const cloneItems = (items: readonly OrderItem[]) => items.map((item) => ({ ...item, selectedOptions: item.selectedOptions ? [...item.selectedOptions] : undefined }));

export const createCompletedOrder = (receipt: ReceiptSnapshot, createdAt = receipt.issuedAt): CompletedOrder => ({
  receiptNumber: receipt.receiptNumber,
  orderNumber: receipt.orderNumber,
  createdAt: createdAt.toISOString(),
  issuedAt: receipt.issuedAt.toISOString(),
  items: cloneItems(receipt.items),
  subtotal:receipt.subtotal,total: receipt.total,discount:receipt.discount,vatBreakdown: receipt.vatBreakdown??calculateVatBreakdown(receipt.items),
  paymentType: "cash",
});

export const newestFirst = (orders: readonly CompletedOrder[]) => [...orders].sort((left, right) => right.issuedAt.localeCompare(left.issuedAt) || right.receiptNumber - left.receiptNumber);

export const addCompletedOrder = (orders: readonly CompletedOrder[], order: CompletedOrder) => newestFirst([...orders, order]);

export const cancelCompletedOrder = (order: CompletedOrder, cancelledAt = new Date()): CompletedOrder => ({ ...order, cancelledAt: cancelledAt.toISOString() });

export const cancelOrderInHistory = (orders: readonly CompletedOrder[], order: CompletedOrder, cancelledAt = new Date()) => orders.map((entry) => entry.receiptNumber === order.receiptNumber && entry.issuedAt === order.issuedAt ? cancelCompletedOrder(entry, cancelledAt) : entry);

export const loadOrderHistory = (storage: Pick<Storage, "getItem">): CompletedOrder[] => {
  try {
    const saved = JSON.parse(storage.getItem(ORDER_HISTORY_KEY) ?? "[]");
    return Array.isArray(saved) ? newestFirst(saved as CompletedOrder[]) : [];
  } catch { return []; }
};

export const saveOrderHistory = (storage: Pick<Storage, "setItem">, orders: readonly CompletedOrder[]) => storage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orders));

export const receiptFromCompletedOrder = (order: CompletedOrder): ReceiptSnapshot => ({
  receiptNumber: order.receiptNumber,
  orderNumber: order.orderNumber,
  issuedAt: new Date(order.issuedAt),
  items: cloneItems(order.items),
  total: order.total,
  subtotal:order.subtotal??order.total,discount:order.discount,
  vatBreakdown: order.vatBreakdown,
  isCancelled: Boolean(order.cancelledAt),
});
