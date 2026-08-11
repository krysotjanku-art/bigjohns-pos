export type Category = "Pizza" | "Přílohy" | "Nápoje" | "Dezerty" | "Toppingy" | "Káva" | "Krabice" | "Rozvoz";

export interface MenuItem {
  id: number;
  cislo?: string;
  nazev: string;
  cena: number;
  kategorie: Category;
  favorite?: boolean;
  pizzaPricing?: PizzaPricingGroup;
  pizzaSizePrices?: Record<PizzaSizeCode, number>;
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
