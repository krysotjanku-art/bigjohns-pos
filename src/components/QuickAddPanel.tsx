import type { MenuItem } from "../types/menu";
import "./QuickAddPanel.css";

interface Props {
  items: readonly MenuItem[];
  onAdd: (item: MenuItem) => void;
}

const quickItemIds = [701, 501, 502, 503];

export function QuickAddPanel({ items, onAdd }: Props) {
  const quickItems = quickItemIds.flatMap((id) => {
    const item = items.find((entry) => entry.id === id);
    return item ? [item] : [];
  });

  const label = (item: MenuItem) => item.id >= 501 && item.id <= 503 ? item.nazev.replace(/^Krabice\s*/i, "") : item.nazev;
  return <section className="quick-add" aria-label="Rychlé přidání"><span>⚡ Rychlé přidání</span><div>{quickItems.map((item) => <button key={item.id} type="button" onClick={() => onAdd(item)}><span>{label(item)}</span><strong>{item.cena} Kč</strong></button>)}</div></section>;
}
