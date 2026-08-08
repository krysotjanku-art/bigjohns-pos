import type { Category, MenuItem } from "../types/menu";
import "./PizzaGrid.css";
interface Props { activeCategory: Category; menuItems: readonly MenuItem[]; searching?: boolean; onItemSelect: (item: MenuItem) => void; }
export function PizzaGrid({ activeCategory, menuItems, searching = false, onItemSelect }: Props) { return <div className="menu-grid">{menuItems.filter((item) => searching || item.kategorie === activeCategory).map((item) => <button key={item.id} type="button" onClick={() => onItemSelect(item)} className={`menu-grid__tile ${item.kategorie === "Pizza" ? "menu-grid__tile--pizza" : ""}`}>{item.kategorie === "Pizza" ? <><strong>{item.cislo}</strong><span>{item.nazev}</span></> : <><span>{item.nazev}</span><strong>{item.cena} Kč</strong></>}</button>)}</div>; }
