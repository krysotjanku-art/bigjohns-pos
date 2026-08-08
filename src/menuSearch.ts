import type { MenuItem } from "./types/menu";
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("cs-CZ");
export const searchMenu = (items: readonly MenuItem[], query: string) => { const term = normalize(query.trim()); return term ? items.filter((item) => normalize(`${item.cislo ?? ""} ${item.nazev}`).includes(term)) : items; };
