import { describe, expect, it } from "vitest";
import { addCompletedOrder, createCompletedOrder, loadOrderHistory, receiptFromCompletedOrder, saveOrderHistory } from "./orderHistory";
import { createReceiptSnapshot } from "./receiptSnapshot";
import type { OrderItem } from "./types/menu";

const item = (id: number, quantity = 1): OrderItem => ({ id, nazev: `Položka ${id}`, cena: id * 10, kategorie: "Dezerty", vatRate: 12, pocet: quantity });
const receipt = (receiptNumber: number, orderNumber: number, issuedAt: string, items = [item(1)]) => createReceiptSnapshot(items, receiptNumber, orderNumber, new Date(issuedAt));
const memoryStorage = () => {
  let value: string | null = null;
  return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
};

describe("order history", () => {
  it("saves a completed order with its receipt data", () => {
    const storage = memoryStorage();
    const completed = createCompletedOrder(receipt(154, 23, "2026-08-08T18:42:00.000Z", [item(1, 2)]));
    saveOrderHistory(storage, [completed]);

    expect(loadOrderHistory(storage)).toEqual([completed]);
  });

  it("survives reload from localStorage", () => {
    const storage = memoryStorage();
    const completed = createCompletedOrder(receipt(155, 24, "2026-08-08T18:43:00.000Z"));
    saveOrderHistory(storage, [completed]);

    expect(loadOrderHistory(storage)[0]?.receiptNumber).toBe(155);
  });

  it("sorts multiple completed orders newest first", () => {
    const oldOrder = createCompletedOrder(receipt(154, 23, "2026-08-08T18:42:00.000Z"));
    const newOrder = createCompletedOrder(receipt(155, 24, "2026-08-08T18:43:00.000Z"));

    expect(addCompletedOrder([newOrder], oldOrder).map(({ orderNumber }) => orderNumber)).toEqual([24, 23]);
  });

  it("does not alter the current order when history is opened", () => {
    const currentOrder = [item(1, 2)];
    const completed = createCompletedOrder(receipt(154, 23, "2026-08-08T18:42:00.000Z"));
    addCompletedOrder([], completed);

    expect(currentOrder).toEqual([item(1, 2)]);
  });

  it("prints a copy from saved data without creating new numbers or history entries", () => {
    const completed = createCompletedOrder(receipt(154, 23, "2026-08-08T18:42:00.000Z", [item(1, 2)]));
    const history = [completed];
    const copy = receiptFromCompletedOrder(completed);

    expect(copy).toMatchObject({ receiptNumber: 154, orderNumber: 23, total: 20 });
    expect(history).toEqual([completed]);
  });
});
