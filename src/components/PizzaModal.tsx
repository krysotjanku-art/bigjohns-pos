import type { MenuItem, PizzaSize } from "../types/menu";
import { pizzaPrices } from "../data/menu";
import "./PizzaModal.css";

interface Props { pizza: MenuItem | null; onClose: () => void; onSizeSelect: (pizza: MenuItem, size: PizzaSize) => void; }
const sizes: readonly PizzaSize[] = [{ code: "S", label: "S (30 cm)", idOffset: 0 }, { code: "M", label: "M (35 cm)", idOffset: 100 }, { code: "XL", label: "XL (45 cm)", idOffset: 200 }];

export function PizzaModal({ pizza, onClose, onSizeSelect }: Props) {
  if (!pizza) return null;
  const prices = pizza.pizzaSizePrices ?? pizzaPrices[pizza.pizzaPricing!];
  return <div className="pizza-modal__backdrop" onClick={onClose}><section className="pizza-modal" role="dialog" aria-modal="true" aria-label="Výběr velikosti pizzy" onClick={(event) => event.stopPropagation()}><button type="button" className="pizza-modal__close" aria-label="Zavřít výběr velikosti" onClick={onClose}>×</button><header><h2>{pizza.cislo} {pizza.nazev}</h2><p>Vyberte velikost</p></header><div className="pizza-modal__sizes">{sizes.map((size) => <button key={size.code} type="button" onClick={() => onSizeSelect(pizza, size)}><span>{size.label}</span><strong>{prices[size.code]} Kč</strong></button>)}</div></section></div>;
}
