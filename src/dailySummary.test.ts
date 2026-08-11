import { describe, expect, it } from "vitest";
import { calculateDailySummary } from "./dailySummary";
import { cancelCompletedOrder, createCompletedOrder } from "./orderHistory";
import { createReceiptSnapshot } from "./receiptSnapshot";
import type { OrderItem } from "./types/menu";

const day = new Date("2026-08-08T12:00:00.000Z");
const item = (id: number, name: string, category: OrderItem["kategorie"], price: number, quantity: number, vatRate: 12 | 21): OrderItem => ({ id, nazev: name, kategorie: category, cena: price, pocet: quantity, vatRate, ...(category === "Pizza" ? { cislo: String(id).padStart(2, "0") } : {}) });
const order = (receiptNumber: number, orderNumber: number, items: OrderItem[]) => createCompletedOrder(createReceiptSnapshot(items, receiptNumber, orderNumber, new Date("2026-08-08T10:00:00.000Z")));

describe("daily summary", () => {
  it("summarizes normal completed orders for the current day", () => {
    const summary = calculateDailySummary([order(1, 1, [item(1, "01 Margherita S", "Pizza", 100, 2, 12), item(101, "Cola", "Nápoje", 50, 1, 21)])], day);

    expect(summary).toMatchObject({ orderCount: 1, grossRevenue: 250, netRevenue: 250, cancelledOrderCount: 0, pizzas: 2, drinks: 1, bestSellingPizza: { number: "01", name: "Margherita", quantity: 2 } });
  });

  it("excludes cancelled orders from final revenue and sold products", () => {
    const active = order(1, 1, [item(1, "01 Margherita S", "Pizza", 100, 1, 12)]);
    const cancelled = cancelCompletedOrder(order(2, 2, [item(2, "02 Pepperoni M", "Pizza", 200, 2, 12)]), new Date("2026-08-08T11:00:00.000Z"));
    const summary = calculateDailySummary([active, cancelled], day);

    expect(summary).toMatchObject({ orderCount: 2, grossRevenue: 500, cancelledOrderCount: 1, cancelledValue: 400, netRevenue: 100, pizzas: 1 });
  });

  it("uses VAT from non-cancelled orders only", () => {
    const summary = calculateDailySummary([order(1, 1, [item(1, "Pizza", "Pizza", 112, 1, 12), item(101, "Cola", "Nápoje", 121, 1, 21)])], day);

    expect(summary.vat12).toBeCloseTo(12);
    expect(summary.vat21).toBeCloseTo(21);
    expect(summary.revenueWithoutVat).toBeCloseTo(200);
    expect(summary.totalVat).toBeCloseTo(33);
    expect(summary.revenueIncludingVat).toBeCloseTo(233);
  });

  it("counts product quantities by category", () => {
    const items = [item(1, "Pizza", "Pizza", 100, 2, 12), item(101, "Cola", "Nápoje", 50, 3, 21), item(201, "Espresso", "Káva", 40, 4, 21), item(401, "Topping", "Toppingy", 10, 5, 12), item(501, "Box", "Krabice", 10, 6, 12), item(601, "Delivery", "Rozvoz", 30, 7, 12)];
    const summary = calculateDailySummary([order(1, 1, items)], day);

    expect(summary).toMatchObject({ pizzas: 2, drinks: 3, coffees: 4, toppings: 5, boxes: 6, deliveries: 7 });
  });

  it("finds the best-selling pizza", () => {
    const summary = calculateDailySummary([order(1, 1, [item(1, "01 Margherita S", "Pizza", 100, 2, 12), item(2, "02 Pepperoni M", "Pizza", 120, 3, 12)])], day);

    expect(summary.bestSellingPizza).toEqual({ number: "02", name: "Pepperoni", quantity: 3 });
  });
});
