import { useState } from "react";
import "./MenuManagementScreen.css";
import type { ManagedPizza } from "../pizzaMenu";
import type { MenuItem } from "../types/menu";

interface Props {
  pizzas: ManagedPizza[];
  onSave: (pizzas: ManagedPizza[]) => void;
  onBackToPos: () => void;
  onReset: () => void;
  drinks: MenuItem[];
  onSaveDrinks: (drinks: MenuItem[]) => void;
  onResetDrinks: () => void;
}

export function MenuManagementScreen({ pizzas, onSave, onBackToPos, onReset, drinks, onSaveDrinks, onResetDrinks }: Props) {
  const [draft, setDraft] = useState(pizzas);
  const [drinkDraft, setDrinkDraft] = useState(drinks);
  const [category, setCategory] = useState<"pizza" | "drinks">("pizza");

  const updatePizza = (index: number, key: keyof ManagedPizza, value: string) => setDraft(draft.map((pizza, pizzaIndex) => pizzaIndex === index ? { ...pizza, [key]: value } : pizza));
  const updatePizzaPrice = (index: number, size: "S" | "M" | "XL", value: string) => setDraft(draft.map((pizza, pizzaIndex) => pizzaIndex === index ? { ...pizza, prices: { ...pizza.prices, [size]: Number(value) } } : pizza));
  const updateDrink = (index: number, changes: Partial<MenuItem>) => setDrinkDraft(drinkDraft.map((drink, drinkIndex) => drinkIndex === index ? { ...drink, ...changes } : drink));

  const tabs = [["pizza", "🍕 Pizzy"], ["drinks", "🥤 Nápoje"], ["coffee", "☕ Káva"], ["toppings", "🧀 Toppingy"], ["boxes", "📦 Krabice"], ["delivery", "🚗 Rozvoz"]] as const;
  return <section className="menu-management-ui">
    <button onClick={onBackToPos}>← Zpět na pokladnu</button>
    <h1>Správa menu</h1>
    <div className="menu-management-ui__tabs">{tabs.map(([key, label]) => <button key={key} disabled={key !== "pizza" && key !== "drinks"} className={category === key ? "active" : ""} onClick={() => (key === "pizza" || key === "drinks") && setCategory(key)}>{label}</button>)}</div>
    {category === "pizza" && <><div className="menu-management-ui__header"><h2>Pizzy</h2><div><button onClick={() => onSave(draft)}>Uložit pizzy</button><button onClick={onReset}>Obnovit výchozí pizzy</button></div></div>
    <div className="menu-management-ui__cards">{draft.map((pizza, index) => <div className="menu-management-ui__card" key={pizza.id}>
      <input value={pizza.cislo} onChange={(event) => updatePizza(index, "cislo", event.target.value)} />
      <input value={pizza.nazev} onChange={(event) => updatePizza(index, "nazev", event.target.value)} />
      {(["S", "M", "XL"] as const).map((size) => <input key={size} type="number" value={pizza.prices[size]} onChange={(event) => updatePizzaPrice(index, size, event.target.value)} />)}
      <button onClick={() => setDraft(draft.filter((_, pizzaIndex) => pizzaIndex !== index))}>Smazat</button>
    </div>)}</div></>}
    {category === "drinks" && <><div className="menu-management-ui__header"><h2>Nápoje</h2><div><button onClick={() => setDrinkDraft([...drinkDraft, { id: Math.max(100, ...drinkDraft.map((drink) => drink.id)) + 1, nazev: "Nový nápoj", cena: 0, kategorie: "Nápoje" }])}>+ Přidat položku</button><button onClick={onResetDrinks}>Obnovit výchozí nápoje</button></div></div><div className="menu-management-ui__cards">{drinkDraft.map((drink, index) => <div className="menu-management-ui__card" key={drink.id}>
      <input value={drink.nazev} onChange={(event) => updateDrink(index, { nazev: event.target.value })} />
      <input type="number" value={drink.cena} onChange={(event) => updateDrink(index, { cena: Number(event.target.value) })} />
      <button onClick={() => setDrinkDraft(drinkDraft.filter((_, drinkIndex) => drinkIndex !== index))}>Smazat</button>
      <button onClick={() => index && setDrinkDraft(drinkDraft.map((item, drinkIndex) => drinkIndex === index ? drinkDraft[index - 1] : drinkIndex === index - 1 ? item : item))}>↑</button>
      <button onClick={() => index < drinkDraft.length - 1 && setDrinkDraft(drinkDraft.map((item, drinkIndex) => drinkIndex === index ? drinkDraft[index + 1] : drinkIndex === index + 1 ? item : item))}>↓</button>
    </div>)}</div><button onClick={() => onSaveDrinks(drinkDraft)}>Uložit nápoje</button></>}
  </section>;
}
