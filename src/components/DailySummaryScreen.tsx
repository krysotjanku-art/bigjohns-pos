import { calculateDailySummary } from "../dailySummary";
import type { CompletedOrder } from "../orderHistory";

interface Props { orders: readonly CompletedOrder[]; onBackToPos: () => void; }

const money = (amount: number, decimals = 0) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);

export function DailySummaryScreen({ orders, onBackToPos }: Props) {
  const summary = calculateDailySummary(orders);
  return <section><button type="button" onClick={onBackToPos}>← Zpět na pokladnu</button><h1>Denní přehled</h1><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, textAlign: "left" }}><div>Počet objednávek: <strong>{summary.orderCount}</strong></div><div>Tržba celkem: <strong>{money(summary.grossRevenue)}</strong></div><div>Počet stornovaných objednávek: <strong>{summary.cancelledOrderCount}</strong></div><div>Hodnota stornovaných objednávek: <strong>{money(summary.cancelledValue)}</strong></div><div>Tržba po odečtení storen: <strong>{money(summary.netRevenue)}</strong></div><div>DPH 12 %: <strong>{money(summary.vat12, 2)}</strong></div><div>DPH 21 %: <strong>{money(summary.vat21, 2)}</strong></div></div><h2>Produkty dnes</h2><div style={{ display: "grid", gap: 6, textAlign: "left" }}><div>Počet prodaných pizz: <strong>{summary.pizzas}</strong></div><div>Počet prodaných nápojů: <strong>{summary.drinks}</strong></div><div>Počet prodaných káv: <strong>{summary.coffees}</strong></div><div>Počet toppingů: <strong>{summary.toppings}</strong></div><div>Počet krabic: <strong>{summary.boxes}</strong></div><div>Počet rozvozů: <strong>{summary.deliveries}</strong></div></div><h2>Nejprodávanější pizza dnes</h2>{summary.bestSellingPizza ? <p>{summary.bestSellingPizza.number} {summary.bestSellingPizza.name} — <strong>{summary.bestSellingPizza.quantity} ks</strong></p> : <p>Zatím nebyla prodána žádná pizza.</p>}</section>;
}
