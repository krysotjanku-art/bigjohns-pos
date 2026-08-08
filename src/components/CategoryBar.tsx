import type { Category } from "../types/menu";

interface Props {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const options: ReadonlyArray<{ category: Category; label: string }> = [{ category: "Pizza", label: "🍕 Pizzy" }, { category: "Nápoje", label: "🥤 Nápoje" }, { category: "Káva", label: "☕ Káva" }, { category: "Dezerty", label: "🍪 Dezerty" }, { category: "Toppingy", label: "➕ Toppingy" }, { category: "Krabice", label: "📦 Krabice" }];

export function CategoryBar({ activeCategory, onCategoryChange }: Props) {
  return <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>{options.map(({ category, label }) => <button key={category} type="button" onClick={() => onCategoryChange(category)} style={{ width: 130, height: 60, fontSize: 18, fontWeight: "bold", background: activeCategory === category ? "#ff9800" : "#ffffff", color: activeCategory === category ? "white" : "black", border: "2px solid #ff9800", borderRadius: 10, cursor: "pointer" }}>{label}</button>)}</div>;
}
