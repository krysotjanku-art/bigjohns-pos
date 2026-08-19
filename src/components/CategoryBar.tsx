import type { Category } from "../types/menu";
import { Icon, type PosIcon } from "./Icon";
import "./PosUi.css";

interface Props {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const options: ReadonlyArray<{ category: Category; label: string }> = [
  { category: "Pizza", label: "Pizzy" },
  { category: "Přílohy", label: "Přílohy" },
  { category: "Nápoje", label: "Nápoje" },
  { category: "Káva", label: "Káva" },
  { category: "Dezerty", label: "Dezerty" },
  { category: "Toppingy", label: "Toppingy" },
  { category: "Krabice", label: "Krabice" },
  { category: "Rozvoz", label: "Rozvoz" },
];

const icons: readonly PosIcon[] = ["pizza", "sides", "drink", "coffee", "dessert", "topping", "box", "delivery"];

export function CategoryBar({ activeCategory, onCategoryChange }: Props) {
  return <div className="category-bar">{options.map(({ category, label }, index) => <button className={activeCategory === category ? "active" : ""} key={category} onClick={() => onCategoryChange(category)}><span className="category-bar__icon"><Icon name={icons[index]} /></span><span className="category-bar__label">{label}</span></button>)}</div>;
}
