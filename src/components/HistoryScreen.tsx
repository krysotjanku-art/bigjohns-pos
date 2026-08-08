import { useState } from "react";
import type { CompletedOrder } from "../orderHistory";

interface Props {
  orders: readonly CompletedOrder[];
  onPrintCopy: (order: CompletedOrder) => void;
  onCancel: (order: CompletedOrder) => CompletedOrder;
  onBackToPos: () => void;
}

const money = (amount: number, decimals = 0) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
const dateTime = (date: string) => new Intl.DateTimeFormat("cs-CZ", { dateStyle: "short", timeStyle: "short" }).format(new Date(date));
const itemName = (name: string) => name.replace(/^\d{2}\s+/, "");

export function HistoryScreen({ orders, onPrintCopy, onCancel, onBackToPos }: Props) {
  const [selected, setSelected] = useState<CompletedOrder | null>(null);
  const cancelSelected = () => {
    if (!selected || selected.cancelledAt || !window.confirm(`Opravdu chcete stornovat objednávku č. ${String(selected.orderNumber).padStart(3, "0")}?`)) return;
    setSelected(onCancel(selected));
  };

  if (selected) return <section><button type="button" onClick={onBackToPos}>← Zpět na pokladnu</button><button type="button" onClick={() => setSelected(null)}>← Zpět do historie</button><h1>Objednávka {String(selected.orderNumber).padStart(3, "0")} {selected.cancelledAt && "— STORNO"}</h1><p>Účtenka {String(selected.receiptNumber).padStart(6, "0")} · {dateTime(selected.issuedAt)} · Hotovost</p>{selected.cancelledAt && <p><strong>STORNO</strong> · {dateTime(selected.cancelledAt)}</p>}<div>{selected.items.map((item, index) => <div key={`${item.id}-${item.selectedSize ?? ""}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 8 }}><span>{item.pocet}× {itemName(item.nazev)}{item.selectedSize ? ` ${item.selectedSize}` : ""}</span><span>{money(item.cena * item.pocet)}</span></div>)}</div><hr /><h2>Celkem: {money(selected.total)}</h2><h3>Přehled DPH</h3>{selected.vatBreakdown.map((vat) => <div key={vat.rate}>{vat.rate} %: základ {money(vat.base, 2)}, DPH {money(vat.vat, 2)}</div>)}<button type="button" onClick={() => onPrintCopy(selected)} style={{ marginTop: 24, padding: "12px 20px", fontSize: 18 }}>Tisk kopie</button>{!selected.cancelledAt && <button type="button" onClick={cancelSelected} style={{ marginTop: 24, marginLeft: 12, padding: "12px 20px", fontSize: 18 }}>Storno objednávky</button>}</section>;

  return <section><button type="button" onClick={onBackToPos}>← Zpět na pokladnu</button><h1>Historie objednávek</h1>{orders.length === 0 ? <p>Zatím nejsou žádné dokončené objednávky.</p> : <div>{orders.map((order) => <button type="button" key={`${order.receiptNumber}-${order.issuedAt}`} onClick={() => setSelected(order)} style={{ display: "block", width: "100%", padding: 16, marginBottom: 10, textAlign: "left", fontSize: 16, cursor: "pointer" }}>Obj. {String(order.orderNumber).padStart(3, "0")} | Účtenka {String(order.receiptNumber).padStart(6, "0")} | {dateTime(order.issuedAt)} | {money(order.total)}{order.cancelledAt ? " | STORNO" : ""}</button>)}</div>}</section>;
}
