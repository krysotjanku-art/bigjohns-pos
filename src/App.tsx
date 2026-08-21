import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { CategoryBar } from "./components/CategoryBar";
import { BackupScreen } from "./components/BackupScreen";
import { DailySummaryReceipt } from "./components/DailySummaryReceipt";
import { DailySummaryScreen } from "./components/DailySummaryScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { OrderPanel } from "./components/OrderPanel";
import { DiscountModal } from "./components/DiscountModal";
import { PizzaGrid } from "./components/PizzaGrid";
import { QuickAddPanel } from "./components/QuickAddPanel";
import { PizzaModal } from "./components/PizzaModal";
import { Receipt } from "./components/Receipt";
import { SalesOverviewScreen } from "./components/SalesOverviewScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { MenuManagementScreen } from "./components/MenuManagementScreen";
import { PinDialog } from "./components/PinDialog";
import { SuspendedOrdersScreen } from "./components/SuspendedOrdersScreen";
import "./main-pos-tablet-polish.css";
import "./accent-refresh.css";
import "./android-webview-compat.css";
import bigJohnsLogo from "./assets/bigjohns-oval-logo.png";
import { changePin, loadPin } from "./adminPin";
import { loadAccent, loadAppearance, resolveAppearance, saveAccent, saveAppearance, subscribeToSystemAppearance, systemPrefersDark, type Accent, type Appearance } from "./appearance";
import { pizzaPrices } from "./data/menu";
import { ORDER_COUNTER_KEY, RECEIPT_COUNTER_KEY } from "./backup";
import { calculateDailySummary, type DailySummary } from "./dailySummary";
import { loadSettings, saveSettings, type PosSettings } from "./settings";
import { applyPizzas, defaultOtherMenu, defaults, loadOtherMenu, loadPizzas, saveOtherMenu, savePizzas, valid, validOtherMenu, type ManagedPizza } from "./pizzaMenu";
import { addCompletedOrder, cancelCompletedOrder, cancelOrderInHistory, createCompletedOrder, loadOrderHistory, receiptFromCompletedOrder, saveOrderHistory, type CompletedOrder } from "./orderHistory";
import { addToOrder, orderItemKey, removeOrderItem } from "./order";
import { createReceiptSnapshot, type ReceiptSnapshot } from "./receiptSnapshot";
import { calculateOrderTotals, fixedDiscount, percentageDiscount, type OrderDiscount } from "./discount";
import { requiresPin } from "./pinProtection";
import { addSuspendedOrder, createSuspendedOrder, loadSuspendedOrders, removeSuspendedOrder, restoreSuspendedOrder, saveSuspendedOrders, type SuspendedOrder } from "./suspendedOrders";
import { isNativeUsbPrintingAvailable, printEscPosDailySummary, printEscPosInternalOrderSlip, printEscPosReceipt, printerStatus, testReceipt, type PrinterStatus } from "./usbEscPosPrinter";
import type { Category, MenuItem, OrderItem, OrderItemInput, PizzaSize } from "./types/menu";

// Set this before the first render so native-only CSS fallbacks never flash.
if (typeof document !== "undefined" && isNativeUsbPrintingAvailable()) {
  document.documentElement.dataset.platform = "android";
}

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
  const [settings, setSettings] = useState<PosSettings>(() => loadSettings(localStorage));
  const [pizzas, setPizzas] = useState<ManagedPizza[]>(() => loadPizzas(localStorage));
  const [otherMenu, setOtherMenu] = useState<MenuItem[]>(() => loadOtherMenu(localStorage));
  const [suspendedOrders, setSuspendedOrders] = useState<SuspendedOrder[]>(() => loadSuspendedOrders(localStorage));
  const [view, setView] = useState<"pos" | "suspended" | "history" | "summary" | "overview" | "backup" | "settings" | "menu">("pos");
  const [pendingView,setPendingView]=useState<typeof view|null>(null);
  const [appearance,setAppearance]=useState<Appearance>(()=>loadAppearance(localStorage));
  const [accent,setAccent]=useState<Accent>(()=>loadAccent(localStorage));
  const [systemDark,setSystemDark]=useState(()=>systemPrefersDark(typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : undefined));
  const [discount,setDiscount]=useState<OrderDiscount|null>(null);
  const [discountOpen,setDiscountOpen]=useState(false);
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [printer,setPrinter]=useState<PrinterStatus>({connected:false,permissionGranted:false,message:"Kontrola USB tiskárny…"});
  const totals = useMemo(() => calculateOrderTotals(order, discount), [order,discount]);
  const dailySummary = useMemo(() => calculateDailySummary(history), [history]);
  const configuredMenu = useMemo(() => applyPizzas(pizzas, otherMenu), [otherMenu,pizzas]);
  const theme=resolveAppearance(appearance,systemDark);

  useEffect(() => { const clearPrint = () => { setReceipt(null); setSummaryPrint(null); }; window.addEventListener("afterprint", clearPrint); return () => window.removeEventListener("afterprint", clearPrint); }, []);
  useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
  useEffect(()=>{document.documentElement.dataset.accent=accent;},[accent]);
  useEffect(()=>subscribeToSystemAppearance(typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : undefined,setSystemDark),[]);
  const refreshPrinterStatus=async()=>{setPrinter(await printerStatus())};
  useEffect(()=>{void refreshPrinterStatus()},[]);
  const addItem = (item: OrderItemInput) => { setReceipt(null); setOrder((current) => {if(!current.length)setDiscount(null);return addToOrder(current, item)}); };
  const addMenuItem = (item: MenuItem) => addItem({ ...item, vatRate: item.id >= 101 && item.id < 300 ? settings.standardVat : settings.reducedVat });
  const decrementItem = (itemKey: string) => { setReceipt(null); setOrder((current) => {const next=current.flatMap((item) => orderItemKey(item) !== itemKey ? [item] : item.pocet > 1 ? [{ ...item, pocet: item.pocet - 1 }] : []);if(!next.length)setDiscount(null);return next}); };
  const removeItem = (itemKey: string) => { setReceipt(null); setOrder((current) => {const next=removeOrderItem(current, itemKey);if(!next.length)setDiscount(null);return next}); };
  const handleSize = (pizza: MenuItem, size: PizzaSize) => { const prices=pizza.pizzaSizePrices ?? pizzaPrices[pizza.pizzaPricing!]; addItem({ ...pizza, nazev: `${pizza.cislo} ${pizza.nazev} ${size.code}`, cena: prices[size.code], selectedSize: size.code, vatRate: settings.reducedVat }); setSelectedPizza(null); };
  const handlePay = () => {
    if (!order.length) { setReceipt(null); return; }
    const issuedAt = new Date();
    const currentOrderReceipt = createReceiptSnapshot(order, nextReceiptNumber(), nextOrderNumber(issuedAt), issuedAt,totals.discount);
    const completedOrder = createCompletedOrder(currentOrderReceipt);
    const updatedHistory = addCompletedOrder(history, completedOrder);
    saveOrderHistory(localStorage, updatedHistory);
    flushSync(() => {
      setReceipt(currentOrderReceipt);
      setOrder([]);
      setDiscount(null);
      setHistory(updatedHistory);
    });
    if (isNativeUsbPrintingAvailable()) {
      void (async () => {
        try {
          // Each native print is cut by the USB plugin, so these are two
          // separate physical slips: customer receipt first, internal slip second.
          await printEscPosReceipt(currentOrderReceipt, settings.company);
          await printEscPosInternalOrderSlip(currentOrderReceipt);
          await refreshPrinterStatus();
        } catch {
          await refreshPrinterStatus();
        }
      })();
    } else requestAnimationFrame(() => window.print());
  };
  const reportPrintError = async (reason: unknown) => {
    await refreshPrinterStatus();
    const message = reason instanceof Error ? reason.message : String(reason);
    window.alert(`Tisk se nepodařil. ${message}`);
  };
  const printCopy = async (completedOrder: CompletedOrder) => {
    const copy = receiptFromCompletedOrder(completedOrder);
    setSummaryPrint(null);
    if (isNativeUsbPrintingAvailable()) {
      try {
        await printEscPosReceipt(copy, settings.company);
        await refreshPrinterStatus();
      } catch (reason) { await reportPrintError(reason); }
      return;
    }
    flushSync(() => setReceipt(copy));
    requestAnimationFrame(() => window.print());
  };
  const printDailySummary = async () => {
    const issuedAt = new Date();
    if (isNativeUsbPrintingAvailable()) {
      try {
        await printEscPosDailySummary(dailySummary, issuedAt, settings.company);
        await refreshPrinterStatus();
      } catch (reason) { await reportPrintError(reason); }
      return;
    }
    flushSync(() => { setReceipt(null); setSummaryPrint({ summary: dailySummary, issuedAt }); });
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
  const suspendOrder = () => {
    if (!order.length) return;
    const updated = addSuspendedOrder(suspendedOrders, createSuspendedOrder(order, totals.discount));
    saveSuspendedOrders(localStorage, updated);
    setSuspendedOrders(updated);
    setOrder([]);
    setDiscount(null);
    setReceipt(null);
  };
  const restoreOrder = (suspendedOrder: SuspendedOrder) => {
    const restored = restoreSuspendedOrder(suspendedOrder);
    const updated = removeSuspendedOrder(suspendedOrders, suspendedOrder.id);
    saveSuspendedOrders(localStorage, updated);
    setOrder(restored.items);
    setDiscount(restored.discount);
    setReceipt(null);
    setSuspendedOrders(updated);
    setView("pos");
  };
  const deleteSuspendedOrder = (suspendedOrder: SuspendedOrder) => {
    const updated = removeSuspendedOrder(suspendedOrders, suspendedOrder.id);
    saveSuspendedOrders(localStorage, updated);
    setSuspendedOrders(updated);
  };

  const open=(next:typeof view)=>{setDrawerOpen(false);if(requiresPin(settings.pinEnabled !== false,next))setPendingView(next);else setView(next)};
  const navigation = <nav className="pos-navigation"><button className="pos-navigation__toggle" type="button" aria-label="Otevřít navigaci" aria-expanded={drawerOpen} onClick={()=>setDrawerOpen(!drawerOpen)}><span/><span/><span/></button><img className="pos-navigation__logo" src={bigJohnsLogo} alt="Big John's Pizza" />{drawerOpen&&<button className="pos-navigation__overlay" type="button" aria-label="Zavřít navigaci" onClick={()=>setDrawerOpen(false)}/>}<aside className={`pos-navigation__drawer${drawerOpen?" is-open":""}`} aria-hidden={!drawerOpen}><div className="pos-navigation__drawer-head"><strong>Menu</strong><button type="button" aria-label="Zavřít navigaci" onClick={()=>setDrawerOpen(false)}>×</button></div><button className={view === "pos" ? "is-active" : ""} onClick={()=>open("pos")}>Pokladna</button><button className={view === "history" ? "is-active" : ""} onClick={()=>open("history")}>Historie</button><button className={view === "summary" ? "is-active" : ""} onClick={()=>open("summary")}>Denní přehled</button><button className={view === "overview" ? "is-active" : ""} onClick={()=>open("overview")}>Přehled</button><button className={view === "backup" ? "is-active" : ""} onClick={()=>open("backup")}>Záloha</button><button className={view === "settings" ? "is-active" : ""} onClick={()=>open("settings")}>Nastavení</button><button className={view === "menu" ? "is-active" : ""} onClick={()=>open("menu")}>Správa menu</button></aside></nav>;
  if(pendingView)return <PinDialog onCancel={()=>setPendingView(null)} onSubmit={(pin)=>{if(pin!==loadPin(localStorage))return false;setView(pendingView);setPendingView(null);return true;}}/>;
  if (view === "suspended") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><SuspendedOrdersScreen orders={suspendedOrders} onRestore={restoreOrder} onDelete={deleteSuspendedOrder} onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /></>;
  if (view === "history") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><HistoryScreen orders={history} onPrintCopy={printCopy} onCancel={cancelOrder} onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /></>;
  if (view === "summary") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><DailySummaryScreen summary={dailySummary} onPrint={printDailySummary} onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /><DailySummaryReceipt summary={summaryPrint?.summary ?? null} issuedAt={summaryPrint?.issuedAt ?? null} /></>;
  if (view === "overview") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><SalesOverviewScreen orders={history} onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /></>;
  if (view === "backup") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><BackupScreen onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /></>;
  if (view === "settings") return <>{navigation}<main style={{ minHeight: "calc(100vh - 52px)", padding: 20, fontFamily: "Arial", background: "#f5f5f5" }}><SettingsScreen settings={settings} appearance={appearance} accent={accent} printerStatus={printer} onRefreshPrinterStatus={()=>void refreshPrinterStatus()} onPrintTest={()=>void printEscPosReceipt(testReceipt(), settings.company).then(refreshPrinterStatus).catch(refreshPrinterStatus)} onAppearanceChange={(next)=>{saveAppearance(localStorage,next);setAppearance(next)}} onAccentChange={(next)=>{saveAccent(localStorage,next);setAccent(next)}} onChangePin={(current,next,confirm)=>changePin(localStorage,current,next,confirm)} onPinEnabledChange={(pinEnabled)=>{const next={...settings,pinEnabled};saveSettings(localStorage,next);setSettings(next)}} onSave={(next) => { saveSettings(localStorage, next); setSettings(next); }} onBackToPos={() => setView("pos")} /></main><Receipt receipt={receipt} /></>;
  if(view==="menu")return <>{navigation}<main><MenuManagementScreen pizzas={pizzas} otherItems={otherMenu} onSavePizzas={next=>{if(valid(next)){savePizzas(localStorage,next);setPizzas(next)}}} onSaveOther={next=>{if(validOtherMenu(next)){saveOtherMenu(localStorage,next);setOtherMenu(next)}}} onResetPizzas={()=>{const next=defaults();savePizzas(localStorage,next);setPizzas(next)}} onResetCategory={category=>{const next=[...otherMenu.filter(item=>item.kategorie!==category),...defaultOtherMenu().filter(item=>item.kategorie===category)];saveOtherMenu(localStorage,next);setOtherMenu(next)}} onBackToPos={()=>setView("pos")}/></main></>;

  return <>{navigation}<div className="pos-app" style={{ display: "flex", height: "calc(100vh - 52px)", fontFamily: "Arial" }}><main className="pos-menu" style={{ flex: "1 1 auto", minWidth: 0, padding: 20, background: "#f5f5f5" }}><div className="pos-menu__header"><h1>Menu</h1><div className="pos-menu__header-actions"><button className="pos-menu__history" type="button" onClick={() => setView("suspended")}>Pozastavené ({suspendedOrders.length})</button><button className="pos-menu__history" type="button" onClick={() => setView("history")}>Historie</button></div></div><CategoryBar activeCategory={activeCategory} onCategoryChange={setActiveCategory} /><div className="pos-menu__quick-row"><QuickAddPanel items={configuredMenu} onAdd={addMenuItem}/></div><div className="pos-menu__content"><PizzaGrid activeCategory={activeCategory} menuItems={configuredMenu} searching={false} onItemSelect={(item) => { if (item.kategorie === "Pizza") setSelectedPizza(item); else addMenuItem(item); }} /></div></main><OrderPanel items={order} subtotal={totals.subtotal} total={totals.total} discount={totals.discount} onDiscount={()=>setDiscountOpen(true)} onIncrement={(itemKey) => { setReceipt(null); setOrder((current) => current.map((item) => orderItemKey(item) === itemKey ? { ...item, pocet: item.pocet + 1 } : item)); }} onDecrement={decrementItem} onRemove={removeItem} onSuspend={suspendOrder} onPay={handlePay} /><PizzaModal pizza={selectedPizza} onClose={() => setSelectedPizza(null)} onSizeSelect={handleSize} />{discountOpen&&<DiscountModal hasDiscount={Boolean(totals.discount)} onClose={()=>setDiscountOpen(false)} onRemove={()=>{setDiscount(null);setDiscountOpen(false)}} onApply={(type,value)=>{const next=type==="percentage"?percentageDiscount(value,totals.subtotal):fixedDiscount(value,totals.subtotal);if(next){setDiscount(next);setDiscountOpen(false)}}}/>}</div><Receipt receipt={receipt} company={settings.company} /><DailySummaryReceipt summary={summaryPrint?.summary ?? null} issuedAt={summaryPrint?.issuedAt ?? null} /></>;
}

export default App;
