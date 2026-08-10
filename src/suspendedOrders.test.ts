import { describe, expect, it } from "vitest";
import { addSuspendedOrder, createSuspendedOrder, loadSuspendedOrders, removeSuspendedOrder, restoreSuspendedOrder, saveSuspendedOrders } from "./suspendedOrders";
import type { OrderItem } from "./types/menu";

const item = (quantity = 1): OrderItem => ({ id: 1, nazev: "Margherita S", cena: 100, kategorie: "Pizza", vatRate: 12, pocet: quantity, selectedSize: "S" });
const storage = () => { let value: string | null = null; return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } }; };

describe("suspended orders", () => {
  it("stores an unpaid order snapshot with its discount", () => {
    const order = createSuspendedOrder([item(2)], { type: "percentage", percentage: 10, amount: 20 }, new Date("2026-08-11T10:30:00Z"), "parked-1");
    expect(order).toMatchObject({ id: "parked-1", subtotal: 200, total: 180, discount: { type: "percentage", percentage: 10, amount: 20 } });
  });

  it("persists newest suspended orders and restores the original cart", () => {
    const local = storage();
    const older = createSuspendedOrder([item()], null, new Date("2026-08-11T10:00:00Z"), "older");
    const newer = createSuspendedOrder([item(3)], { type: "fixed", amount: 15 }, new Date("2026-08-11T11:00:00Z"), "newer");
    saveSuspendedOrders(local, addSuspendedOrder([older], newer));
    const saved = loadSuspendedOrders(local);
    expect(saved.map((order) => order.id)).toEqual(["newer", "older"]);
    expect(restoreSuspendedOrder(saved[0])).toMatchObject({ items: [item(3)], discount: { type: "fixed", amount: 15 } });
  });

  it("deletes only the selected suspended order", () => {
    const first = createSuspendedOrder([item()], null, new Date(), "first");
    const second = createSuspendedOrder([item()], null, new Date(), "second");
    expect(removeSuspendedOrder([first, second], "first").map((order) => order.id)).toEqual(["second"]);
  });
});
