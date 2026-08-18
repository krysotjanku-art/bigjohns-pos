import { useEffect, useMemo, useState } from "react";
import { defaultOtherMenu, type ManagedPizza } from "../pizzaMenu";
import type { Category, MenuItem } from "../types/menu";
import { BackToPosButton } from "./BackToPosButton";
import { Icon, type PosIcon } from "./Icon";
import "./MenuManagementScreen.css";

type MenuCategory = Exclude<Category, "Pizza">;
type CategoryMeta = { category: MenuCategory; title: string; reset: string; icon: PosIcon };
interface Props { pizzas: ManagedPizza[]; otherItems: MenuItem[]; onSavePizzas: (pizzas: ManagedPizza[]) => void; onSaveOther: (items: MenuItem[]) => void; onResetPizzas: () => void; onResetCategory: (category: MenuCategory) => void; onBackToPos: () => void; }

const defaultCategory = (from: number, to: number) => defaultOtherMenu().find((item) => item.id >= from && item.id <= to)!.kategorie as MenuCategory;
const otherCategories: readonly CategoryMeta[] = [
  { category: defaultCategory(700, 799), title: "Přílohy", reset: "Obnovit výchozí přílohy", icon: "sides" },
  { category: defaultCategory(100, 199), title: "Nápoje", reset: "Obnovit výchozí nápoje", icon: "drink" },
  { category: defaultCategory(200, 299), title: "Káva", reset: "Obnovit výchozí kávu", icon: "coffee" },
  { category: defaultCategory(300, 399), title: "Dezerty", reset: "Obnovit výchozí dezerty", icon: "dessert" },
  { category: defaultCategory(400, 499), title: "Toppingy", reset: "Obnovit výchozí toppingy", icon: "topping" },
  { category: defaultCategory(500, 599), title: "Krabice", reset: "Obnovit výchozí krabice", icon: "box" },
  { category: defaultCategory(600, 699), title: "Rozvoz", reset: "Obnovit výchozí rozvoz", icon: "delivery" },
];

export function MenuManagementScreen({ pizzas, otherItems, onSavePizzas, onSaveOther, onResetPizzas, onResetCategory, onBackToPos }: Props) {
  const [pizzaDraft, setPizzaDraft] = useState(pizzas); const [otherDraft, setOtherDraft] = useState(otherItems); const [selected, setSelected] = useState<"pizza" | MenuCategory>("pizza");
  useEffect(() => setPizzaDraft(pizzas), [pizzas]); useEffect(() => setOtherDraft(otherItems), [otherItems]);
  const categories = useMemo(() => [{ key: "pizza" as const, title: "Pizzy", reset: "Obnovit výchozí pizzy", icon: "pizza" as PosIcon }, ...otherCategories.map((item) => ({ key: item.category, ...item }))], []);
  const active = categories.find((item) => item.key === selected)!; const pizza = selected === "pizza"; const current = pizza ? [] : otherDraft.filter((item) => item.kategorie === selected);
  const save = () => pizza ? onSavePizzas(pizzaDraft) : onSaveOther(otherDraft);
  const reset = () => { if (window.confirm(`${active.reset}?`)) { if (pizza) onResetPizzas(); else onResetCategory(selected); } };
  const addPizza = () => { const number = Math.max(0, ...pizzaDraft.map((item) => Number(item.cislo))) + 1; setPizzaDraft([...pizzaDraft, { id: Math.max(0, ...pizzaDraft.map((item) => item.id)) + 1, cislo: String(number).padStart(2, "0"), nazev: "Nová pizza", prices: { S: 0, M: 0, XL: 0 } }]); };
  const addItem = () => { if (pizza) return; const id = Math.max(0, ...otherDraft.map((item) => item.id)) + 1; setOtherDraft([...otherDraft, { id, nazev: "Nová položka", cena: 0, kategorie: selected }]); };
  const updatePizza = (index: number, patch: Partial<ManagedPizza>) => setPizzaDraft(pizzaDraft.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateItem = (id: number, patch: Partial<MenuItem>) => setOtherDraft(otherDraft.map((item) => item.id === id ? { ...item, ...patch } : item));
  return <section className="menu-management-ui"><BackToPosButton onClick={onBackToPos} /><h1>Správa menu</h1><div className="menu-management-ui__tabs">{categories.map((item) => <button key={item.key} className={selected === item.key ? "active" : ""} onClick={() => setSelected(item.key)}><Icon name={item.icon} className="menu-management-ui__tab-icon" />{item.title}</button>)}</div><div className="menu-management-ui__header"><h2><Icon name={active.icon} className="menu-management-ui__heading-icon" />{active.title}</h2><div><button onClick={pizza ? addPizza : addItem}>+ Přidat položku</button><button onClick={reset}>{active.reset}</button><button onClick={save}>Uložit</button></div></div>{pizza ? <div className="menu-management-ui__cards">{pizzaDraft.map((item, index) => <article className="menu-management-ui__card" key={item.id}><label><span>Číslo</span><input value={item.cislo} onChange={(event) => updatePizza(index, { cislo: event.target.value })} /></label><label><span>Název</span><input value={item.nazev} onChange={(event) => updatePizza(index, { nazev: event.target.value })} /></label>{(["S", "M", "XL"] as const).map((size) => <label key={size}><span>{size}</span><input type="number" min="0" value={item.prices[size]} onChange={(event) => updatePizza(index, { prices: { ...item.prices, [size]: Number(event.target.value) } })} /></label>)}<label className="menu-management-ui__favorite"><span>Oblíbené</span><input type="checkbox" checked={Boolean(item.favorite)} onChange={(event) => updatePizza(index, { favorite: event.target.checked })} /></label><div className="menu-management-ui__card-actions"><button onClick={() => setPizzaDraft(pizzaDraft.filter((_, itemIndex) => itemIndex !== index))}>Smazat</button></div></article>)}</div> : <div className="menu-management-ui__cards">{current.map((item) => <article className="menu-management-ui__card" key={item.id}><label><span>Název</span><input value={item.nazev} onChange={(event) => updateItem(item.id, { nazev: event.target.value })} /></label><label><span>Cena</span><input type="number" min="0" value={item.cena} onChange={(event) => updateItem(item.id, { cena: Number(event.target.value) })} /></label><label className="menu-management-ui__favorite"><span>Oblíbené</span><input type="checkbox" checked={Boolean(item.favorite)} onChange={(event) => updateItem(item.id, { favorite: event.target.checked })} /></label><div className="menu-management-ui__card-actions"><button onClick={() => setOtherDraft(otherDraft.filter((entry) => entry.id !== item.id))}>Smazat</button></div></article>)}</div>}</section>;
}
