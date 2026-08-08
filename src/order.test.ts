import { describe, expect, it } from "vitest";
import { addToOrder } from "./order";
import type { OrderItemInput } from "./types/menu";

const drink = (id: number, nazev: string): OrderItemInput => ({ id, nazev, cena: 49, kategorie: "Nápoje", vatRate: 21 });
const dessert = (): OrderItemInput => ({ id: 301, nazev: "Cookies", cena: 55, kategorie: "Dezerty", vatRate: 12 });
const pizza = (id: number, nazev: string, selectedSize: "S" | "M" | "XL"): OrderItemInput => ({ id, cislo: String(id).padStart(2, "0"), nazev: `${String(id).padStart(2, "0")} ${nazev} ${selectedSize}`, cena: 249, kategorie: "Pizza", selectedSize, vatRate: 12 });

describe("order line identity", () => {
  it("keeps a drink and a pizza separate", () => expect(addToOrder(addToOrder([], drink(101, "Coca-Cola")), pizza(1, "Margherita", "M"))).toHaveLength(2));
  it("keeps a dessert and a pizza separate", () => expect(addToOrder(addToOrder([], dessert()), pizza(1, "Margherita", "M"))).toHaveLength(2));
  it("keeps different drinks separate", () => expect(addToOrder(addToOrder([], drink(101, "Coca-Cola")), drink(103, "Fanta"))).toHaveLength(2));
  it("merges the same drink", () => expect(addToOrder(addToOrder([], drink(101, "Coca-Cola")), drink(101, "Coca-Cola"))).toEqual([expect.objectContaining({ pocet: 2 })]));
  it("merges the same pizza and size", () => expect(addToOrder(addToOrder([], pizza(1, "Margherita", "M")), pizza(1, "Margherita", "M"))).toEqual([expect.objectContaining({ pocet: 2 })]));
  it("keeps pizza sizes separate", () => expect(addToOrder(addToOrder([], pizza(1, "Margherita", "S")), pizza(1, "Margherita", "XL"))).toHaveLength(2));
});
