export type Category = "Pizza" | "Nápoje" | "Dezerty" | "Toppingy" | "Káva";

export interface MenuItem {
  id: number;
  cislo?: string;
  nazev: string;
  cena: number;
  kategorie: Category;
}

export interface OrderItem extends Omit<MenuItem, "kategorie"> {
  pocet: number;
}

export type OrderItemInput = Omit<OrderItem, "pocet">;

export interface PizzaSize { label: string; priceOffset: number; idOffset: number; }
