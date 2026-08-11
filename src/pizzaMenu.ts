import { menu, pizzaPrices } from "./data/menu";
import type { MenuItem, PizzaSizeCode } from "./types/menu";
export const PIZZA_MENU_KEY = "bigjohns.custom-pizzas";
export const CUSTOM_MENU_KEY = "bigjohns.custom-menu-items";
export interface ManagedPizza { id: number; cislo: string; nazev: string; prices: Record<PizzaSizeCode, number>; }
export const defaults = (): ManagedPizza[] => menu.filter((item) => item.kategorie === "Pizza").map((item) => ({ id:item.id,cislo:item.cislo!,nazev:item.nazev,prices:pizzaPrices[item.pizzaPricing!]}));
export const valid = (pizzas: ManagedPizza[]) => new Set(pizzas.map((pizza)=>pizza.cislo)).size===pizzas.length && pizzas.every((pizza)=>/^\d{2,}$/.test(pizza.cislo)&&pizza.nazev.trim()&&(["S","M","XL"]as const).every(size=>Number.isFinite(pizza.prices[size])&&pizza.prices[size]>=0));
export const loadPizzas=(storage:Pick<Storage,"getItem">)=>{try{const value=JSON.parse(storage.getItem(PIZZA_MENU_KEY)??"null");return Array.isArray(value)&&valid(value)?value:defaults();}catch{return defaults();}};
export const savePizzas=(storage:Pick<Storage,"setItem">,pizzas:ManagedPizza[])=>storage.setItem(PIZZA_MENU_KEY,JSON.stringify(pizzas));
export const applyPizzas=(pizzas:ManagedPizza[], items:readonly MenuItem[])=>[...pizzas.map((pizza):MenuItem=>({id:pizza.id,cislo:pizza.cislo,nazev:pizza.nazev,cena:pizza.prices.S,kategorie:"Pizza",pizzaSizePrices:pizza.prices})),...items.filter((item)=>item.kategorie!=="Pizza")];
export const defaultOtherMenu=()=>menu.filter((item)=>item.kategorie!=="Pizza").map((item)=>({...item}));
export const validOtherMenu=(items:MenuItem[])=>items.every((item)=>item.kategorie!=="Pizza"&&item.nazev.trim()&&Number.isFinite(item.cena)&&item.cena>=0);
export const loadOtherMenu=(storage:Pick<Storage,"getItem">)=>{try{const value=JSON.parse(storage.getItem(CUSTOM_MENU_KEY)??"null");if(!Array.isArray(value)||!validOtherMenu(value))return defaultOtherMenu();const migrated=value.map((item:MenuItem)=>(item.kategorie as string)==="Omáčky"?{...item,id:item.id+3,kategorie:"Přílohy" as const}:item);const categories=new Set(migrated.map(item=>item.kategorie));const defaults=defaultOtherMenu();const missingSides=defaults.filter(item=>item.kategorie==="Přílohy"&&!migrated.some(saved=>saved.kategorie==="Přílohy"&&saved.id===item.id));return[...migrated,...defaults.filter(item=>item.kategorie!=="Přílohy"&&!categories.has(item.kategorie)),...missingSides]}catch{return defaultOtherMenu();}};
export const saveOtherMenu=(storage:Pick<Storage,"setItem">,items:MenuItem[])=>storage.setItem(CUSTOM_MENU_KEY,JSON.stringify(items));
