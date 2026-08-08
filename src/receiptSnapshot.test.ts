import { describe, expect, it } from "vitest";
import { createReceiptSnapshot } from "./receiptSnapshot";
import type { OrderItem } from "./types/menu";

const item = (id: number, nazev: string, pocet = 1): OrderItem => ({ id, nazev, cena: id * 10, kategorie: "Dezerty", vatRate: 12, pocet });
const snapshot = (items: OrderItem[]) => createReceiptSnapshot(items, 1, 1, new Date("2026-01-01"));

describe("receipt snapshot", () => {
  it("contains one current order item only", () => expect(snapshot([item(1, "Cookies")]).items).toEqual([item(1, "Cookies")]));
  it("contains exactly three different current items", () => expect(snapshot([item(1, "A"), item(2, "B"), item(3, "C")]).items.map(({ id }) => id)).toEqual([1, 2, 3]));
  it("does not retain items from a previous order", () => { const first = snapshot([item(1, "Old")]); const second = snapshot([item(2, "New")]); expect(first.items).toHaveLength(1); expect(second.items).toEqual([item(2, "New")]); });
  it("does not include an item removed before payment", () => expect(snapshot([item(2, "Kept")]).items).toEqual([item(2, "Kept")]));
  it("uses the current quantity only", () => expect(snapshot([item(1, "Cookies", 3)]).items[0]?.pocet).toBe(3));
});
