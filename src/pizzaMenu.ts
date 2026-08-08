import { menu, pizzaPrices } from "./data/menu";
import type { MenuItem, PizzaSizeCode } from "./types/menu";
export const PIZZA_MENU_KEY = "bigjohns.custom-pizzas";
export interface ManagedPizza { id: number; cislo: string; nazev: string; prices: Record<PizzaSizeCode, number>; }
export const defaults = (): ManagedPizza[] => menu.filter((item) => item.kategorie === "Pizza").map((item) => ({ id:item.id,cislo:item.cislo!,nazev:item.nazev,prices:pizzaPrices[item.pizzaPricing!]}));
export const valid = (pizzas: ManagedPizza[]) => new Set(pizzas.map((pizza)=>pizza.cislo)).size===pizzas.length && pizzas.every((pizza)=>/^\d{2,}$/.test(pizza.cislo)&&pizza.nazev.trim()&&Object.values(pizza.prices).every((price)=>Number.isFinite(price)&&price>=0));
export const loadPizzas=(storage:Pick<Storage,"getItem">)=>{try{const value=JSON.parse(storage.getItem(PIZZA_MENU_KEY)??"null");return Array.isArray(value)&&valid(value)?value:defaults();}catch{return defaults();}};
export const savePizzas=(storage:Pick<Storage,"setItem">,pizzas:ManagedPizza[])=>storage.setItem(PIZZA_MENU_KEY,JSON.stringify(pizzas));
export const applyPizzas=(pizzas:ManagedPizza[], items:readonly MenuItem[])=>[...pizzas.map((pizza):MenuItem=>({id:pizza.id,cislo:pizza.cislo,nazev:pizza.nazev,cena:pizza.prices.S,kategorie:"Pizza",pizzaSizePrices:pizza.prices})),...items.filter((item)=>item.kategorie!=="Pizza")];
