export type Category = "Pizza" | "Nápoje" | "Dezerty" | "Toppingy" | "Káva" | "Krabice" | "Rozvoz";

export interface MenuItem {
  id: number;
  cislo?: string;
  nazev: string;
  cena: number;
  kategorie: Category;
  pizzaPricing?: PizzaPricingGroup;
}

export interface OrderItem extends MenuItem {
  pocet: number;
  vatRate: number;
  selectedSize?: PizzaSizeCode;
  selectedOptions?: readonly string[];
}

export type OrderItemInput = Omit<OrderItem, "pocet">;

export type PizzaSizeCode = "S" | "M" | "XL";
export type PizzaPricingGroup = "Margherita" | "Classic" | "Combo" | "Premium";

export interface PizzaSize {
  code: PizzaSizeCode;
  label: string;
  idOffset: number;
}
