import { orderItemKey } from "../order";
import type { OrderItem } from "../types/menu";

interface Props {
  items: readonly OrderItem[];
  total: number;
  onIncrement: (itemKey: string) => void;
  onDecrement: (itemKey: string) => void;
  onRemove: (itemKey: string) => void;
  onPay: () => void;
}

export function OrderPanel({ items, total, onIncrement, onDecrement, onRemove, onPay }: Props) {
  return <aside style={{ flex: "0 0 400px", minWidth: 360, padding: 20, background: "white", borderLeft: "2px solid #ddd" }}><h2>🧾 Objednávka</h2>{items.map((item) => { const itemKey = orderItemKey(item); return <div key={itemKey} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}><span style={{ flex: "1 1 auto", minWidth: 0, overflowWrap: "normal", wordBreak: "normal" }}>{item.nazev} × {item.pocet} - {item.cena * item.pocet} Kč</span><div style={{ display: "flex", flex: "0 0 115px" }}><button type="button" onClick={() => onDecrement(itemKey)} style={{ width: 35, height: 35, background: "#e74c3c", color: "white", border: "none", borderRadius: 6, fontSize: 20, cursor: "pointer", marginRight: 5 }}>−</button><button type="button" onClick={() => onIncrement(itemKey)} style={{ width: 35, height: 35, background: "#2ecc71", color: "white", border: "none", borderRadius: 6, fontSize: 20, cursor: "pointer", marginRight: 5 }}>+</button><button type="button" aria-label={`Odstranit ${item.nazev}`} onClick={() => onRemove(itemKey)} style={{ width: 35, height: 35, background: "#666", color: "white", border: "none", borderRadius: 6, fontSize: 18, cursor: "pointer" }}>🗑</button></div></div>; })}<hr /><h2>Celkem: {total} Kč</h2><button type="button" onClick={onPay} style={{ width: "100%", height: 70, background: "green", color: "white", fontSize: 28, border: "none", cursor: "pointer" }}>Zaplatit</button></aside>;
}
