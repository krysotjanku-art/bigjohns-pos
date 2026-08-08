import type { MenuItem } from "./types/menu";
export const searchMenu = (items: readonly MenuItem[], query: string) => { const term = query.trim().toLocaleLowerCase("cs-CZ"); return term ? items.filter((item) => `${item.cislo ?? ""} ${item.nazev}`.toLocaleLowerCase("cs-CZ").includes(term)) : items; };
