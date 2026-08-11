import type { CompletedOrder } from "./orderHistory";

export interface DailySummary {
  orderCount: number;
  grossRevenue: number;
  cancelledOrderCount: number;
  cancelledValue: number;
  netRevenue: number;
  vat12: number;
  vat21: number;
  pizzas: number;
  drinks: number;
  coffees: number;
  toppings: number;
  boxes: number;
  deliveries: number;
  sauces: number;
  bestSellingPizza: { number: string; name: string; quantity: number } | null;
}

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const itemName = (name: string) => name.replace(/^\d+\s+/, "").replace(/\s+(S|M|XL)$/, "");

export const calculateDailySummary = (orders: readonly CompletedOrder[], day = new Date()): DailySummary => {
  const today = localDateKey(day);
  const todayOrders = orders.filter((order) => localDateKey(new Date(order.issuedAt)) === today);
  const activeOrders = todayOrders.filter((order) => !order.cancelledAt);
  const countCategory = (category: string) => activeOrders.flatMap((order) => order.items).filter((item) => item.kategorie === category).reduce((sum, item) => sum + item.pocet, 0);
  const pizzas = new Map<string, { number: string; name: string; quantity: number }>();
  activeOrders.flatMap((order) => order.items).filter((item) => item.kategorie === "Pizza").forEach((item) => {
    const key = String(item.id);
    const current = pizzas.get(key) ?? { number: item.cislo ?? String(item.id).padStart(2, "0"), name: itemName(item.nazev), quantity: 0 };
    current.quantity += item.pocet;
    pizzas.set(key, current);
  });
  const bestSellingPizza = [...pizzas.values()].sort((left, right) => right.quantity - left.quantity || left.number.localeCompare(right.number))[0] ?? null;
  const grossRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const cancelledOrders = todayOrders.filter((order) => order.cancelledAt);
  const cancelledValue = cancelledOrders.reduce((sum, order) => sum + order.total, 0);
  const vat = (rate: 12 | 21) => activeOrders.reduce((sum, order) => sum + (order.vatBreakdown.find((entry) => entry.rate === rate)?.vat ?? 0), 0);

  return { orderCount: todayOrders.length, grossRevenue, cancelledOrderCount: cancelledOrders.length, cancelledValue, netRevenue: grossRevenue - cancelledValue, vat12: vat(12), vat21: vat(21), pizzas: countCategory("Pizza"), drinks: countCategory("Nápoje"), coffees: countCategory("Káva"), toppings: countCategory("Toppingy"), boxes: countCategory("Krabice"), deliveries: countCategory("Rozvoz"), sauces: countCategory("Omáčky"), bestSellingPizza };
};
