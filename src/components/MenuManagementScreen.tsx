import { useState } from "react";
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

  const updatePizza = (index: number, key: keyof ManagedPizza, value: string) => setDraft(draft.map((pizza, pizzaIndex) => pizzaIndex === index ? { ...pizza, [key]: value } : pizza));
  const updatePizzaPrice = (index: number, size: "S" | "M" | "XL", value: string) => setDraft(draft.map((pizza, pizzaIndex) => pizzaIndex === index ? { ...pizza, prices: { ...pizza.prices, [size]: Number(value) } } : pizza));
  const updateDrink = (index: number, changes: Partial<MenuItem>) => setDrinkDraft(drinkDraft.map((drink, drinkIndex) => drinkIndex === index ? { ...drink, ...changes } : drink));

  return <section>
    <button onClick={onBackToPos}>← Zpět na pokladnu</button>
    <h1>Správa menu</h1>
    {draft.map((pizza, index) => <div key={pizza.id}>
      <input value={pizza.cislo} onChange={(event) => updatePizza(index, "cislo", event.target.value)} />
      <input value={pizza.nazev} onChange={(event) => updatePizza(index, "nazev", event.target.value)} />
      {(["S", "M", "XL"] as const).map((size) => <input key={size} type="number" value={pizza.prices[size]} onChange={(event) => updatePizzaPrice(index, size, event.target.value)} />)}
      <button onClick={() => setDraft(draft.filter((_, pizzaIndex) => pizzaIndex !== index))}>Smazat</button>
    </div>)}
    <button onClick={() => onSave(draft)}>Uložit pizzy</button>
    <button onClick={onReset}>Obnovit výchozí pizzy</button>
    <h2>Nápoje</h2>
    {drinkDraft.map((drink, index) => <div key={drink.id}>
      <input value={drink.nazev} onChange={(event) => updateDrink(index, { nazev: event.target.value })} />
      <input type="number" value={drink.cena} onChange={(event) => updateDrink(index, { cena: Number(event.target.value) })} />
      <button onClick={() => setDrinkDraft(drinkDraft.filter((_, drinkIndex) => drinkIndex !== index))}>Smazat</button>
      <button onClick={() => index && setDrinkDraft(drinkDraft.map((item, drinkIndex) => drinkIndex === index ? drinkDraft[index - 1] : drinkIndex === index - 1 ? item : item))}>↑</button>
      <button onClick={() => index < drinkDraft.length - 1 && setDrinkDraft(drinkDraft.map((item, drinkIndex) => drinkIndex === index ? drinkDraft[index + 1] : drinkIndex === index + 1 ? item : item))}>↓</button>
    </div>)}
    <button onClick={() => setDrinkDraft([...drinkDraft, { id: Math.max(100, ...drinkDraft.map((drink) => drink.id)) + 1, nazev: "Nový nápoj", cena: 0, kategorie: "Nápoje" }])}>Přidat nápoj</button>
    <button onClick={() => onSaveDrinks(drinkDraft)}>Uložit nápoje</button>
    <button onClick={onResetDrinks}>Obnovit výchozí nápoje</button>
  </section>;
}
