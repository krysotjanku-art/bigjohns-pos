import { useEffect, useState } from "react";
import { BackToPosButton } from "./BackToPosButton"; import "./MenuManagementScreen.css";
import type { ManagedPizza } from "../pizzaMenu";
import type { Category, MenuItem } from "../types/menu";

type MenuCategory = Exclude<Category, "Pizza">;

interface Props {
  pizzas: ManagedPizza[];
  otherItems: MenuItem[];
  onSavePizzas: (pizzas: ManagedPizza[]) => void;
  onSaveOther: (items: MenuItem[]) => void;
  onResetPizzas: () => void;
  onResetCategory: (category: MenuCategory) => void;
  onBackToPos: () => void;
}

const categories: ["pizza" | MenuCategory, string, string][] = [
  ["pizza", "đźŤ• Pizzy", "Obnovit výchozí pizzy"],
  ["Nápoje", "đźĄ¤ Nápoje", "Obnovit výchozí nápoje"],
  ["Káva", "☕ Káva", "Obnovit výchozí kávu"],
  ["Dezerty", "đźŤŞ Dezerty", "Obnovit výchozí dezerty"],
  ["Toppingy", "đź§€ Toppingy", "Obnovit výchozí toppingy"],
  ["Krabice", "đź“¦ Krabice", "Obnovit výchozí krabice"],
  ["Rozvoz", "đźš— Rozvoz", "Obnovit výchozí rozvoz"],
];

const base: Record<MenuCategory, number> = { Nápoje: 100, Káva: 200, Dezerty: 300, Toppingy: 400, Krabice: 500, Rozvoz: 600 };

export function MenuManagementScreen({ pizzas, otherItems, onSavePizzas, onSaveOther, onResetPizzas, onResetCategory, onBackToPos }: Props) {
  const [pizzaDraft, setPizzaDraft] = useState(pizzas);
  const [otherDraft, setOtherDraft] = useState(otherItems);
  const [category, setCategory] = useState<"pizza" | MenuCategory>("pizza");
  useEffect(() => setPizzaDraft(pizzas), [pizzas]);
  useEffect(() => setOtherDraft(otherItems), [otherItems]);
  const pizza = category === "pizza";
  const current = pizza ? [] : otherDraft.filter((item) => item.kategorie === category);
  const selectedCategory = categories.find((entry) => entry[0] === category)!;
  const save = () => pizza ? onSavePizzas(pizzaDraft) : onSaveOther(otherDraft);
  const reset = () => { if (window.confirm(`${selectedCategory[2]}?`)) { if (pizza) onResetPizzas(); else onResetCategory(category); } };
  const addPizza = () => { const number = Math.max(0, ...pizzaDraft.map((item) => Number(item.cislo))) + 1; setPizzaDraft([...pizzaDraft, { id: Math.max(0, ...pizzaDraft.map((item) => item.id)) + 1, cislo: String(number).padStart(2, "0"), nazev: "Nová pizza", prices: { S: 0, M: 0, XL: 0 } }]); };
  const addItem = () => { if (pizza) return; const id = Math.max(base[category], ...current.map((item) => item.id)) + 1; setOtherDraft([...otherDraft, { id, nazev: "Nová položka", cena: 0, kategorie: category }]); };
  const updatePizza = (index: number, patch: Partial<ManagedPizza>) => setPizzaDraft(pizzaDraft.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const updateItem = (id: number, patch: Partial<MenuItem>) => setOtherDraft(otherDraft.map((item) => item.id === id ? { ...item, ...patch } : item));

  return <section className="menu-management-ui">
    <BackToPosButton onClick={onBackToPos}/><h1>Správa menu</h1>
    <div className="menu-management-ui__tabs">{categories.map(([key, label]) => <button key={key} className={category === key ? "active" : ""} onClick={() => setCategory(key)}>{label}</button>)}</div>
    <div className="menu-management-ui__header"><h2>{selectedCategory[1]}</h2><div><button onClick={pizza ? addPizza : addItem}>+ Přidat položku</button><button onClick={reset}>{selectedCategory[2]}</button><button onClick={save}>Uložit</button></div></div>
    {pizza ? <div className="menu-management-ui__cards">{pizzaDraft.map((item, index) => <article className="menu-management-ui__card" key={item.id}><label>Číslo<input value={item.cislo} onChange={(event) => updatePizza(index, { cislo: event.target.value })} /></label><label>Název<input value={item.nazev} onChange={(event) => updatePizza(index, { nazev: event.target.value })} /></label>{(["S", "M", "XL"] as const).map((size) => <label key={size}>{size}<input type="number" min="0" value={item.prices[size]} onChange={(event) => updatePizza(index, { prices: { ...item.prices, [size]: Number(event.target.value) } })} /></label>)}<div className="menu-management-ui__card-actions"><button onClick={() => setPizzaDraft(pizzaDraft.filter((_, itemIndex) => itemIndex !== index))}>Smazat</button></div></article>)}</div> : <div className="menu-management-ui__cards">{current.map((item) => <article className="menu-management-ui__card" key={item.id}><label>Název<input value={item.nazev} onChange={(event) => updateItem(item.id, { nazev: event.target.value })} /></label><label>Cena<input type="number" min="0" value={item.cena} onChange={(event) => updateItem(item.id, { cena: Number(event.target.value) })} /></label><div className="menu-management-ui__card-actions"><button onClick={() => setOtherDraft(otherDraft.filter((entry) => entry.id !== item.id))}>Smazat</button></div></article>)}</div>}
  </section>;
}
