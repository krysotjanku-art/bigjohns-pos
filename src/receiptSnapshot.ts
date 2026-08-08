import type { OrderItem } from "./types/menu";

export interface ReceiptSnapshot {
  issuedAt: Date;
  receiptNumber: number;
  orderNumber: number;
  items: readonly OrderItem[];
  total: number;
}

export const createReceiptSnapshot = (items: readonly OrderItem[], receiptNumber: number, orderNumber: number, issuedAt: Date): ReceiptSnapshot => ({
  issuedAt,
  receiptNumber,
  orderNumber,
  items: items.map((item) => ({ ...item, selectedOptions: item.selectedOptions ? [...item.selectedOptions] : undefined })),
  total: items.reduce((sum, item) => sum + item.cena * item.pocet, 0),
});
