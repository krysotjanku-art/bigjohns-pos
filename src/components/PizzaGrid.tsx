import type { Category, MenuItem } from "../types/menu";
interface Props { activeCategory: Category; menuItems: readonly MenuItem[]; onItemSelect: (item: MenuItem) => void; }
export function PizzaGrid({ activeCategory, menuItems, onItemSelect }: Props) { return <>{menuItems.filter((item) => item.kategorie === activeCategory).map((item) => <button key={item.id} type="button" onClick={() => onItemSelect(item)} style={{ width: 250, height: 70, marginBottom: 15, fontSize: 22 }}>{item.kategorie === "Pizza" ? <>{item.cislo} {item.nazev}</> : <>{item.nazev}<br />{item.cena} Kč</>}</button>)}</>; }
