import { useMemo, useState } from "react";
import { CategoryBar } from "./components/CategoryBar";
import { OrderPanel } from "./components/OrderPanel";
import { PizzaGrid } from "./components/PizzaGrid";
import { PizzaModal } from "./components/PizzaModal";
import { Receipt } from "./components/Receipt";
import { menu, pizzaPrices } from "./data/menu";
import type { Category, MenuItem, OrderItem, OrderItemInput, PizzaSize } from "./types/menu";

const RECEIPT_COUNTER_KEY = "bigjohns.receipt-counter";
const ORDER_COUNTER_KEY = "bigjohns.order-counter";
const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const nextReceiptNumber = () => { const next = Number(localStorage.getItem(RECEIPT_COUNTER_KEY) ?? 0) + 1; localStorage.setItem(RECEIPT_COUNTER_KEY, String(next)); return next; };
const nextOrderNumber = (date: Date) => { const today = localDateKey(date); const saved = JSON.parse(localStorage.getItem(ORDER_COUNTER_KEY) ?? "{}"); const next = saved.date === today ? Number(saved.value ?? 0) + 1 : 1; localStorage.setItem(ORDER_COUNTER_KEY, JSON.stringify({ date: today, value: next })); return next; };

function App() {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("Pizza");
  const [selectedPizza, setSelectedPizza] = useState<MenuItem | null>(null);
  const [receipt, setReceipt] = useState<{ issuedAt: Date; receiptNumber: number; orderNumber: number; items: readonly OrderItem[]; total: number } | null>(null);
  const total = useMemo(() => order.reduce((sum, item) => sum + item.cena * item.pocet, 0), [order]);

  const addItem = (item: OrderItemInput) => setOrder((current) => { const found = current.find((entry) => entry.id === item.id); return found ? current.map((entry) => entry.id === item.id ? { ...entry, pocet: entry.pocet + 1 } : entry) : [...current, { ...item, pocet: 1 }]; });
  const addMenuItem = (item: MenuItem) => addItem({ ...item, vatRate: item.id >= 101 && item.id < 300 ? 21 : 12 });
  const decrementItem = (itemId: number) => setOrder((current) => current.flatMap((item) => item.id !== itemId ? [item] : item.pocet > 1 ? [{ ...item, pocet: item.pocet - 1 }] : []));
  const handleSize = (pizza: MenuItem, size: PizzaSize) => { if (!pizza.pizzaPricing) return; addItem({ id: pizza.id + size.idOffset, cislo: pizza.cislo, nazev: `${pizza.cislo} ${pizza.nazev} ${size.code}`, cena: pizzaPrices[pizza.pizzaPricing][size.code], vatRate: 12 }); setSelectedPizza(null); };
  const handlePay = () => { if (!order.length) return; const issuedAt = new Date(); setReceipt({ issuedAt, receiptNumber: nextReceiptNumber(), orderNumber: nextOrderNumber(issuedAt), items: order, total }); setOrder([]); requestAnimationFrame(() => window.print()); };

  return <><div className="pos-app" style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}><main style={{ flex: 2, padding: 20, background: "#f5f5f5" }}><h1>🍕 Menu</h1><CategoryBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} /><PizzaGrid activeCategory={activeCategory} menuItems={menu} onItemSelect={(item) => item.kategorie === "Pizza" ? setSelectedPizza(item) : addMenuItem(item)} /></main><OrderPanel items={order} total={total} onIncrement={(itemId) => setOrder((current) => current.map((item) => item.id === itemId ? { ...item, pocet: item.pocet + 1 } : item))} onDecrement={decrementItem} onPay={handlePay} /><PizzaModal pizza={selectedPizza} onClose={() => setSelectedPizza(null)} onSizeSelect={handleSize} /></div><Receipt receipt={receipt} /></>;
}

export default App;
