import type { MenuItem } from "../types/menu";
import { Icon } from "./Icon";
import "./QuickAddPanel.css";

interface Props { items: readonly MenuItem[]; onAdd: (item: MenuItem) => void; }
const displayName = (name: string) => name.replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\uFE0F?\s*/, "");

export function QuickAddPanel({ items, onAdd }: Props) {
  const quickItems = items.filter((item) => item.favorite);
  const label = (item: MenuItem) => (item.id >= 501 && item.id <= 503 ? displayName(item.nazev).replace(/^Krabice\s*/i, "") : displayName(item.nazev));
  return <section className="quick-add" aria-label="Oblíbené"><span><Icon name="star" className="quick-add__icon" />Oblíbené</span><div>{quickItems.map((item) => <button key={item.id} type="button" onClick={() => onAdd(item)}><span>{label(item)}</span><strong>{item.cena} Kč</strong></button>)}</div></section>;
}
