import { orderItemKey } from "../order";
import type { OrderDiscount } from "../discount";
import type { OrderItem } from "../types/menu";
import "./PosUi.css";
import "./OrderDiscount.css";

interface Props {
  items: readonly OrderItem[];
  subtotal: number;
  total: number;
  discount: OrderDiscount | null;
  onDiscount: () => void;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
  onSuspend: () => void;
  onPay: () => void;
}

export function OrderPanel({ items, subtotal, total, discount, onDiscount, onIncrement, onDecrement, onRemove, onSuspend, onPay }: Props) {
  return <aside className="order-panel">
    <h2>🧾 Objednávka</h2>
    <div className="order-panel__items">{items.map((item) => {
      const key = orderItemKey(item);
      return <div className="order-line" key={key}><div className="order-line__details"><span className="order-line__name">{item.nazev}</span><div className="order-line__meta"><span>× {item.pocet}</span><strong>{item.cena * item.pocet} Kč</strong></div></div><div className="order-line__controls"><button aria-label="Odebrat jednu položku" onClick={() => onDecrement(key)}>−</button><button className="order-line__increase" aria-label="Přidat jednu položku" onClick={() => onIncrement(key)}>+</button><button className="order-line__remove" aria-label="Odstranit položku" onClick={() => onRemove(key)}>🗑</button></div></div>;
    })}</div>
    <footer>
      <button className="order-panel__discount" onClick={onDiscount}>Sleva</button>
      {discount && <div className="order-panel__discount-summary"><span>Mezisoučet</span><strong>{subtotal} Kč</strong><span>Sleva{discount.type === "percentage" ? ` ${discount.percentage} %` : ""}</span><strong>−{discount.amount} Kč</strong></div>}
      <div>Celkem <strong>{total} Kč</strong></div><small>Včetně DPH</small>
      <button className="order-panel__suspend" onClick={onSuspend} disabled={!items.length}>Pozastavit</button>
      <button onClick={onPay}>Zaplatit</button>
    </footer>
  </aside>;
}
