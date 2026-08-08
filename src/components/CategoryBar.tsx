import type { Category } from "../types/menu"; import "./PosUi.css";
interface Props { activeCategory: Category; onCategoryChange: (category: Category) => void; }
const options: ReadonlyArray<{ category: Category; label: string }> = [{ category:"Pizza",label:"🍕 Pizzy"},{category:"Nápoje",label:"🥤 Nápoje"},{category:"Káva",label:"☕ Káva"},{category:"Dezerty",label:"🍪 Dezerty"},{category:"Toppingy",label:"➕ Toppingy"},{category:"Krabice",label:"📦 Krabice"},{category:"Rozvoz",label:"🚗 Rozvoz"}];
export function CategoryBar({activeCategory,onCategoryChange}:Props){return <div className="category-bar">{options.map(({category,label})=><button className={activeCategory===category?"active":""} key={category} onClick={()=>onCategoryChange(category)}>{label}</button>)}</div>}
