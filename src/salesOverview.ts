import type { CompletedOrder } from "./orderHistory";

export interface SalesOverview {
  orderCount: number; grossRevenue: number; cancelledOrderCount: number; cancelledValue: number; netRevenue: number;
  base12: number; vat12: number; base21: number; vat21: number;
  revenueWithoutVat: number; totalVat: number; revenueIncludingVat: number;
  pizzas: number; sides: number; drinks: number; coffees: number; toppings: number; boxes: number; deliveries: number;
  topPizzas: { number: string; name: string; quantity: number }[];
}

export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const pizzaName = (name: string) => name.replace(/^\d+\s+/, "").replace(/\s+(S|M|XL)$/, "");

export const calculateSalesOverview = (orders: readonly CompletedOrder[], from: string, to: string): SalesOverview => {
  const period = orders.filter((order) => { const issued = dateKey(new Date(order.issuedAt)); return (!from || issued >= from) && (!to || issued <= to); });
  const active = period.filter((order) => !order.cancelledAt);
  const items = active.flatMap((order) => order.items);
  const count = (category: string) => items.filter((item) => item.kategorie === category).reduce((sum, item) => sum + item.pocet, 0);
  const cancelled = period.filter((order) => order.cancelledAt);
  const grossRevenue = period.reduce((sum, order) => sum + order.total, 0);
  const cancelledValue = cancelled.reduce((sum, order) => sum + order.total, 0);
  const vat = (rate: 12 | 21) => active.reduce((sum, order) => sum + (order.vatBreakdown.find((entry) => entry.rate === rate)?.vat ?? 0), 0);
  const pizzas = new Map<string, { number: string; name: string; quantity: number }>();
  items.filter((item) => item.kategorie === "Pizza").forEach((item) => { const key = String(item.id); const entry = pizzas.get(key) ?? { number: item.cislo ?? String(item.id).padStart(2, "0"), name: pizzaName(item.nazev), quantity: 0 }; entry.quantity += item.pocet; pizzas.set(key, entry); });
  const vat12 = vat(12); const vat21 = vat(21);
  const totalVat = active.flatMap((order) => order.vatBreakdown).reduce((sum, entry) => sum + entry.vat, 0);
  const revenueIncludingVat = active.reduce((sum, order) => sum + order.total, 0);
  const revenueWithoutVat = revenueIncludingVat - totalVat;
  return { orderCount: period.length, grossRevenue, cancelledOrderCount: cancelled.length, cancelledValue, netRevenue: grossRevenue - cancelledValue, base12: vat12 * 100 / 12, vat12, base21: vat21 * 100 / 21, vat21, revenueWithoutVat, totalVat, revenueIncludingVat, pizzas: count("Pizza"), sides: count("Přílohy"), drinks: count("Nápoje"), coffees: count("Káva"), toppings: count("Toppingy"), boxes: count("Krabice"), deliveries: count("Rozvoz"), topPizzas: [...pizzas.values()].sort((a, b) => b.quantity - a.quantity || a.number.localeCompare(b.number)).slice(0, 10) };
};
