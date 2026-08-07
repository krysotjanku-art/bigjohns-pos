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
const coffeeDefinitions = [[201, "Espresso", 49], [202, "Cappuccino", 59], [203, "Americano", 55], [204, "Flat White", 69], [205, "Caffè Latte", 69], [206, "Espresso Double", 59], [207, "Hot Tea", 49], [208, "Ledová káva", 95]] as const;

export const menu: readonly MenuItem[] = [
  ...pizzaDefinitions.map(([nazev, pizzaPricing], index): MenuItem => ({ id: index + 1, cislo: String(index + 1).padStart(2, "0"), nazev, cena: pizzaPrices[pizzaPricing].S, kategorie: "Pizza", pizzaPricing })),
  ...drinkDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Nápoje" })),
  ...coffeeDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Káva" })),
  { id: 301, nazev: "Cookies", cena: 55, kategorie: "Dezerty" },
];
