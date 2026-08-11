import { describe, expect, it } from "vitest";
import { calculateSalesOverview } from "./salesOverview";
import { cancelCompletedOrder, createCompletedOrder } from "./orderHistory";
import { createReceiptSnapshot } from "./receiptSnapshot";
import type { OrderItem } from "./types/menu";

const item = (id: number, name: string, category: OrderItem["kategorie"], price: number, quantity: number, vatRate: 12 | 21): OrderItem => ({ id, nazev: name, kategorie: category, cena: price, pocet: quantity, vatRate, ...(category === "Pizza" ? { cislo: String(id).padStart(2, "0") } : {}) });
const order = (receiptNumber: number, date: string, items: OrderItem[]) => createCompletedOrder(createReceiptSnapshot(items, receiptNumber, receiptNumber, new Date(date)));

describe("sales overview", () => {
  it("filters orders inclusively by date range", () => {
    const orders = [order(1, "2026-08-01T10:00:00Z", [item(1, "Pizza", "Pizza", 100, 1, 12)]), order(2, "2026-08-03T10:00:00Z", [item(2, "Pizza", "Pizza", 100, 1, 12)])];
    expect(calculateSalesOverview(orders, "2026-08-02", "2026-08-03").orderCount).toBe(1);
  });

  it("keeps cancellations separate from final revenue and product counts", () => {
    const active = order(1, "2026-08-08T10:00:00Z", [item(1, "01 Margherita S", "Pizza", 112, 2, 12)]);
    const cancelled = cancelCompletedOrder(order(2, "2026-08-08T11:00:00Z", [item(101, "Cola", "Nápoje", 121, 3, 21)]));
    const overview = calculateSalesOverview([active, cancelled], "2026-08-08", "2026-08-08");
    expect(overview).toMatchObject({ grossRevenue: 587, cancelledOrderCount: 1, cancelledValue: 363, netRevenue: 224, pizzas: 2, drinks: 0 });
  });

  it("returns VAT bases and tax totals from active orders", () => {
    const overview = calculateSalesOverview([order(1, "2026-08-08T10:00:00Z", [item(1, "Pizza", "Pizza", 112, 1, 12), item(101, "Cola", "Nápoje", 121, 1, 21)])], "2026-08-08", "2026-08-08");
    expect(overview.base12).toBeCloseTo(100); expect(overview.vat12).toBeCloseTo(12); expect(overview.base21).toBeCloseTo(100); expect(overview.vat21).toBeCloseTo(21);
    expect(overview.revenueWithoutVat).toBeCloseTo(200); expect(overview.totalVat).toBeCloseTo(33); expect(overview.revenueIncludingVat).toBeCloseTo(233);
  });

  it("counts products and ranks the top pizzas", () => {
    const items = [item(1, "01 Margherita S", "Pizza", 100, 2, 12), item(2, "02 Pepperoni M", "Pizza", 100, 3, 12), item(101, "Cola", "Nápoje", 50, 4, 21), item(201, "Coffee", "Káva", 40, 5, 21), item(401, "Top", "Toppingy", 10, 6, 12), item(501, "Box", "Krabice", 10, 7, 12), item(601, "Delivery", "Rozvoz", 30, 8, 12)];
    const overview = calculateSalesOverview([order(1, "2026-08-08T10:00:00Z", items)], "2026-08-08", "2026-08-08");
    expect(overview).toMatchObject({ pizzas: 5, drinks: 4, coffees: 5, toppings: 6, boxes: 7, deliveries: 8 });
    expect(overview.topPizzas[0]).toEqual({ number: "02", name: "Pepperoni", quantity: 3 });
  });
});
