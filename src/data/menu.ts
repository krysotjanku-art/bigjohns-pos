import type { MenuItem } from "../types/menu";

const pizzaDefinitions = [
  ["Margherita", 189], ["Šunková", 249], ["Pepperoni", 249], ["Slanina", 249], ["Špenátová", 249],
  ["All The Way", 269], ["Meat Lovers", 269], ["Capricciosa", 269], ["Chicken Parmesan", 269], ["Chicken Louisiana", 269], ["Chicken Spinach", 269], ["Diavola", 269], ["Mexico", 269], ["Anchovies", 269], ["White Pie", 269], ["Veggie", 269], ["God Father", 269], ["Hawai", 269], ["Tonno", 269],
  ["Prosciutto", 289], ["Chicken Pesto", 289], ["Cheese Pie", 289], ["Greek", 289], ["Blue Pie", 289], ["Goat Cheese Pie", 289],
] as const;
const drinkDefinitions = [[101, "Coca-Cola 0,5 l", 49], [102, "Coca-Cola Zero 0,5 l", 49], [103, "Fanta Orange 0,5 l", 49], [104, "Sprite 0,5 l", 49], [105, "Ice Tea 0,5 l", 49], [106, "Karásek 0,33 l", 55], [107, "Voda neperlivá 0,5 l", 35]] as const;
const coffeeDefinitions = [[201, "Espresso", 49], [202, "Cappuccino", 59], [203, "Americano", 55], [204, "Flat White", 69], [205, "Caffè Latte", 69], [206, "Espresso Double", 59], [207, "Hot Tea", 49], [208, "Ledová káva", 95]] as const;
export const menu: readonly MenuItem[] = [
  ...pizzaDefinitions.map(([nazev, cena], index): MenuItem => ({ id: index + 1, cislo: String(index + 1).padStart(2, "0"), nazev, cena, kategorie: "Pizza" })),
  ...drinkDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Nápoje" })),
  ...coffeeDefinitions.map(([id, nazev, cena]): MenuItem => ({ id, nazev, cena, kategorie: "Káva" })),
  { id: 301, nazev: "Cookies", cena: 55, kategorie: "Dezerty" },
];
