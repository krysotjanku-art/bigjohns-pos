import type { OrderItem } from "./types/menu";

export interface ReceiptSnapshot {
  issuedAt: Date;
  receiptNumber: number;
  orderNumber: number;
  items: readonly OrderItem[];
  total: number;
  vatBreakdown?: readonly VatBreakdown[];
}

export interface VatBreakdown {
  rate: 12 | 21;
  base: number;
  vat: number;
}

export const calculateVatBreakdown = (items: readonly OrderItem[]): VatBreakdown[] => ([12, 21] as const).map((rate) => {
  const gross = items.filter((item) => item.vatRate === rate).reduce((sum, item) => sum + item.cena * item.pocet, 0);
  const base = gross / (1 + rate / 100);
  return { rate, base, vat: gross - base };
});

export const createReceiptSnapshot = (items: readonly OrderItem[], receiptNumber: number, orderNumber: number, issuedAt: Date): ReceiptSnapshot => ({
  issuedAt,
  receiptNumber,
  orderNumber,
  items: items.map((item) => ({ ...item, selectedOptions: item.selectedOptions ? [...item.selectedOptions] : undefined })),
  total: items.reduce((sum, item) => sum + item.cena * item.pocet, 0),
});
