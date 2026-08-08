import type { MenuItem, PizzaSize } from "../types/menu";
import { pizzaPrices } from "../data/menu";

interface Props { pizza: MenuItem | null; onClose: () => void; onSizeSelect: (pizza: MenuItem, size: PizzaSize) => void; }
const sizes: readonly PizzaSize[] = [{ code: "S", label: "🍕 S (30 cm)", idOffset: 0 }, { code: "M", label: "🍕 M (35 cm)", idOffset: 100 }, { code: "XL", label: "🍕 XL (45 cm)", idOffset: 200 }];

export function PizzaModal({ pizza, onClose, onSizeSelect }: Props) {
  if (!pizza) return null;
  const prices = pizza.pizzaSizePrices ?? pizzaPrices[pizza.pizzaPricing!]; return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}><div style={{ position: "relative", background: "white", padding: 30, borderRadius: 15, textAlign: "center" }}><button type="button" aria-label="Zavřít výběr velikosti" onClick={onClose} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, border: "none", background: "transparent", fontSize: 24, cursor: "pointer" }}>×</button><h2>{pizza.nazev}</h2>{sizes.map((size) => <button key={size.code} type="button" onClick={() => onSizeSelect(pizza, size)} style={{ width: 220, height: 50, margin: 10 }}>{size.label} — {prices[size.code]} Kč</button>)}</div></div>;
}
