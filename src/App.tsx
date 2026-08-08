import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { CategoryBar } from "./components/CategoryBar";
import { BackupScreen } from "./components/BackupScreen";
import { DailySummaryReceipt } from "./components/DailySummaryReceipt";
import { DailySummaryScreen } from "./components/DailySummaryScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { OrderPanel } from "./components/OrderPanel";
import { PizzaGrid } from "./components/PizzaGrid";
import { PizzaModal } from "./components/PizzaModal";
import { Receipt } from "./components/Receipt";
import { SalesOverviewScreen } from "./components/SalesOverviewScreen";
import { menu, pizzaPrices } from "./data/menu";
import { ORDER_COUNTER_KEY, RECEIPT_COUNTER_KEY } from "./backup";
import { calculateDailySummary, type DailySummary } from "./dailySummary";
import { addCompletedOrder, cancelCompletedOrder, cancelOrderInHistory, createCompletedOrder, loadOrderHistory, receiptFromCompletedOrder, saveOrderHistory, type CompletedOrder } from "./orderHistory";
import { addToOrder, orderItemKey, removeOrderItem } from "./order";
import { createReceiptSnapshot, type ReceiptSnapshot } from "./receiptSnapshot";
import type { Category, MenuItem, OrderItem, OrderItemInput, PizzaSize } from "./types/menu";

const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const nextReceiptNumber = () => { const next = Number(localStorage.getItem(RECEIPT_COUNTER_KEY) ?? 0) + 1; localStorage.setItem(RECEIPT_COUNTER_KEY, String(next)); return next; };
const nextOrderNumber = (date: Date) => { const today = localDateKey(date); const saved = JSON.parse(localStorage.getItem(ORDER_COUNTER_KEY) ?? "{}"); const next = saved.date === today ? Number(saved.value ?? 0) + 1 : 1; localStorage.setItem(ORDER_COUNTER_KEY, JSON.stringify({ date: today, value: next })); return next; };

function App() {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>("Pizza");
  const [selectedPizza, setSelectedPizza] = useState<MenuItem | null>(null);
  const [receipt, setReceipt] = useState<ReceiptSnapshot | null>(null);
  const [summaryPrint, setSummaryPrint] = useState<{ summary: DailySummary; issuedAt: Date } | null>(null);
  const [history, setHistory] = useState<CompletedOrder[]>(() => loadOrderHistory(localStorage));
  const [view, setView] = useState<"pos" | "history" | "summary" | "overview" | "backup">("pos");
  const total = useMemo(() => order.reduce((sum, item) => sum + item.cena * item.pocet, 0), [order]);
  const dailySummary = useMemo(() => calculateDailySummary(history), [history]);

  useEffect(() => { const clearPrint = () => { setReceipt(null); setSummaryPrint(null); }; window.addEventListener("afterprint", clearPrint); return () => window.removeEventListener("afterprint", clearPrint); }, []);
  const addItem = (item: OrderItemInput) => { setReceipt(null); setOrder((current) => addToOrder(current, item)); };
  const addMenuItem = (item: MenuItem) => addItem({ ...item, vatRate: item.id >= 101 && item.id < 300 ? 21 : 12 });
  const decrementItem = (itemKey: string) => { setReceipt(null); setOrder((current) => current.flatMap((item) => orderItemKey(item) !== itemKey ? [item] : item.pocet > 1 ? [{ ...item, pocet: item.pocet - 1 }] : [])); };
  const removeItem = (itemKey: string) => { setReceipt(null); setOrder((current) => removeOrderItem(current, itemKey)); };
  const handleSize = (pizza: MenuItem, size: PizzaSize) => { if (!pizza.pizzaPricing) return; addItem({ ...pizza, nazev: `${pizza.cislo} ${pizza.nazev} ${size.code}`, cena: pizzaPrices[pizza.pizzaPricing][size.code], selectedSize: size.code, vatRate: 12 }); setSelectedPizza(null); };
  const handlePay = () => {
    if (!order.length) { setReceipt(null); return; }
    const issuedAt = new Date();
    const currentOrderReceipt = createReceiptSnapshot(order, nextReceiptNumber(), nextOrderNumber(issuedAt), issuedAt);
    const completedOrder = createCompletedOrder(currentOrderReceipt);
    const updatedHistory = addCompletedOrder(history, completedOrder);
    saveOrderHistory(localStorage, updatedHistory);
    flushSync(() => {
      setReceipt(currentOrderReceipt);
      setOrder([]);
      setHistory(updatedHistory);
    });
    requestAnimationFrame(() => window.print());
  };
  const printCopy = (completedOrder: CompletedOrder) => {
    setSummaryPrint(null);
    flushSync(() => setReceipt(receiptFromCompletedOrder(completedOrder)));
    requestAnimationFrame(() => window.print());
  };
  const printDailySummary = () => {
    flushSync(() => { setReceipt(null); setSummaryPrint({ summary: dailySummary, issuedAt: new Date() }); });
    requestAnimationFrame(() => window.print());
  };
  const cancelOrder = (completedOrder: CompletedOrder) => {
    const cancelledAt = new Date();
    const cancelledOrder = cancelCompletedOrder(completedOrder, cancelledAt);
    const updatedHistory = cancelOrderInHistory(history, completedOrder, cancelledAt);
    saveOrderHistory(localStorage, updatedHistory);
    setHistory(updatedHistory);
    return cancelledOrder;
  };

  const navigation = <div style={{ display: "flex", gap: 8, padding: 12, fontFamily: "Arial", background: "white" }}><button type="button" onClick={() => setView("pos")} style={{ fontWeight: view === "pos" ? "bold" : "normal" }}>Pokladna</button><button type="button" onClick={() => setView("history")} style={{ fontWeight: view === "history" ? "bold" : "normal" }}>Historie</button><button type="button" onClick={() => setView("summary")} style={{ fontWeight: view === "summary" ? "bold" : "normal" }}>Denní přehled</button><button type="button" onClick={() => setView("overview")} style={{ fontWeight: view === "overview" ? "bold" : "normal" }}>Přehled</button><button type="button" onClick={() => setView("backup")} style={{ fontWeight: view === "backup" ? "bold" : "normal" }}>Záloha</button></div>;
  if (view === "history") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><HistoryScreen orders={history} onPrintCopy={printCopy} onCancel={cancelOrder} onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /></>;
  if (view === "summary") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><DailySummaryScreen summary={dailySummary} onPrint={printDailySummary} onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /><DailySummaryReceipt summary={summaryPrint?.summary ?? null} issuedAt={summaryPrint?.issuedAt ?? null} /></>;
  if (view === "overview") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><SalesOverviewScreen orders={history} onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /></>;
  if (view === "backup") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><BackupScreen onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /></>;

  return <>{navigation}<div className="pos-app" style={{ display: "flex", height: "calc(100vh - 52px)", fontFamily: "Arial" }}><main style={{ flex: "1 1 auto", minWidth: 0, padding: 20, background: "#f5f5f5" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><h1>Menu</h1><button type="button" onClick={() => setView("history")} style={{ padding: "12px 20px", fontSize: 18, cursor: "pointer" }}>Historie</button></div><CategoryBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} /><PizzaGrid activeCategory={activeCategory} menuItems={menu} onItemSelect={(item) => item.kategorie === "Pizza" ? setSelectedPizza(item) : addMenuItem(item)} /></main><OrderPanel items={order} total={total} onIncrement={(itemKey) => { setReceipt(null); setOrder((current) => current.map((item) => orderItemKey(item) === itemKey ? { ...item, pocet: item.pocet + 1 } : item)); }} onDecrement={decrementItem} onRemove={removeItem} onPay={handlePay} /><PizzaModal pizza={selectedPizza} onClose={() => setSelectedPizza(null)} onSizeSelect={handleSize} /></div><Receipt receipt={receipt} /><DailySummaryReceipt summary={summaryPrint?.summary ?? null} issuedAt={summaryPrint?.issuedAt ?? null} /></>;
}

export default App;
