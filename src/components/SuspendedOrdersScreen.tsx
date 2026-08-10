import { formatDateTime } from "../dateFormat";
import type { SuspendedOrder } from "../suspendedOrders";
import "./SuspendedOrdersScreen.css";

interface Props {
  orders: readonly SuspendedOrder[];
  onRestore: (order: SuspendedOrder) => void;
  onDelete: (order: SuspendedOrder) => void;
  onBackToPos: () => void;
}

const money = (amount: number) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(amount);

export function SuspendedOrdersScreen({ orders, onRestore, onDelete, onBackToPos }: Props) {
  return <section className="suspended-ui">
    <button className="suspended-ui__back" onClick={onBackToPos}>← Zpět na pokladnu</button>
    <h1>Pozastavené objednávky</h1>
    {!orders.length ? <p className="suspended-ui__empty">Nemáte žádné pozastavené objednávky.</p> : <div className="suspended-ui__list">
      {orders.map((order) => <article key={order.id} className="suspended-ui__card">
        <div className="suspended-ui__meta"><span>{formatDateTime(new Date(order.createdAt))}</span><strong>{money(order.total)}</strong></div>
        <div className="suspended-ui__preview">
          {order.items.slice(0, 2).map((item, index) => <span key={`${item.id}-${index}`}>{item.pocet}× {item.nazev}</span>)}
          {order.items.length > 2 && <span>+ {order.items.length - 2} další položky</span>}
        </div>
        <div className="suspended-ui__actions"><button onClick={() => onRestore(order)}>Obnovit</button><button className="danger" onClick={() => onDelete(order)}>Smazat</button></div>
      </article>)}
    </div>}
  </section>;
}
