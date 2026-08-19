import type { MenuItem, PizzaPricingGroup, PizzaSizeCode } from "../types/menu";

export const pizzaPrices: Record<PizzaPricingGroup, Record<PizzaSizeCode, number>> = {
  Margherita: { S: 159, M: 189, XL: 249 },
  Classic: { S: 199, M: 249, XL: 349 },
  Combo: { S: 219, M: 269, XL: 369 },
  Premium: { S: 239, M: 289, XL: 389 },
};

const pizzaDefinitions = [
  ["Margherita", "Margherita"], ["Šunková", "Classic"], ["Pepperoni", "Classic"], ["Slanina", "Classic"], ["Špenátová", "Classic"],
  ["All The Way", "Combo"], ["Meat Lovers", "Combo"], ["Capricciosa", "Combo"], ["Chicken Parmesan", "Combo"], ["Chicken Louisiana", "Combo"], ["Chicken Spinach", "Combo"], ["Diavola", "Combo"], ["Mexico", "Combo"], ["Anchovies", "Combo"], ["White Pie", "Combo"], ["Veggie", "Combo"], ["God Father", "Combo"], ["Hawaii", "Combo"], ["Tonno", "Combo"],
  ["Prosciutto", "Premium"], ["Chicken Pesto", "Premium"], ["Cheese Pie", "Premium"], ["Greek", "Premium"], ["Blue Pie", "Premium"], ["Goat Cheese Pie", "Premium"],
] as const satisfies readonly (readonly [string, PizzaPricingGroup])[];

const drinkDefinitions = [[101, "Coca-Cola 0,5 l", 49], [102, "Coca-Cola Zero 0,5 l", 49], [103, "Fanta Orange 0,5 l", 49], [104, "Sprite 0,5 l", 49], [105, "Ice Tea 0,5 l", 49], [106, "Karásek 0,33 l", 55], [107, "Voda neperlivá 0,5 l", 35]] as const;
const coffeeDefinitions = [[201, "Espresso", 49], [202, "Lungo", 55], [203, "Cappuccino", 59], [204, "Americano", 55], [205, "Flat White", 69], [206, "Caffè Latte", 69], [207, "Espresso Double", 59], [208, "Hot Tea", 49]] as const;
const toppingDefinitions = [[401, "S topping", 25], [402, "S topping", 30], [403, "M topping", 35], [404, "M topping", 40], [405, "XL topping", 55], [406, "XL topping", 65]] as const;
const boxDefinitions = [[501, "Krabice S", 10], [502, "Krabice M", 15], [503, "Krabice XL", 20]] as const;
const deliveryDefinitions = [[601, "Rozvoz", 50], [602, "Rozvoz", 100], [603, "Rozvoz", 150], [604, "Rozvoz", 200]] as const;
const sideDefinitions = [[701, "Slice", 49], [702, "Garlic Bread 3 ks", 55], [703, "Garlic Bread 7 ks", 90], [704, "Chilli Mayo", 39], [705, "Garlic Mayo", 39], [706, "Ketchup", 39]] as const;

export const menu: readonly MenuItem[] = [
  ...pizzaDefinitions.map(([nazev, pizzaPricing], index): MenuItem => ({ id: index + 1, cislo: String(index + 1).padStart(2, "0"), nazev, cena: pizzaPrices[pizzaPricing].S, kategorie: "Pizza", pizzaPricing })),
  ...drinkDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Nápoje" })),
  ...coffeeDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Káva" })),
  { id: 301, nazev: "Cookies", cena: 55, kategorie: "Dezerty" },
  ...toppingDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Toppingy" })),
  ...boxDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Krabice", favorite: true })),
  ...deliveryDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Rozvoz" })),
  ...sideDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Přílohy", favorite: id === 701 })),
];
