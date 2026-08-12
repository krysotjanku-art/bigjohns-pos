export const APPEARANCE_KEY = "bigjohns.appearance";
export const ACCENT_KEY = "bigjohns.accent";

export type Appearance = "light" | "dark" | "system";
export type Accent = "blue" | "green" | "red" | "purple" | "orange";

const appearances: readonly Appearance[] = ["light", "dark", "system"];
const accents: readonly Accent[] = ["blue", "green", "red", "purple", "orange"];

export const loadAppearance = (storage: Pick<Storage, "getItem">): Appearance => {
  const value = storage.getItem(APPEARANCE_KEY);
  return appearances.includes(value as Appearance) ? value as Appearance : "system";
};

export const saveAppearance = (storage: Pick<Storage, "setItem">, appearance: Appearance) => storage.setItem(APPEARANCE_KEY, appearance);

export const loadAccent = (storage: Pick<Storage, "getItem">): Accent => {
  const value = storage.getItem(ACCENT_KEY);
  return accents.includes(value as Accent) ? value as Accent : "red";
};

export const saveAccent = (storage: Pick<Storage, "setItem">, accent: Accent) => storage.setItem(ACCENT_KEY, accent);

export const resolveAppearance = (appearance: Appearance, systemDark: boolean) => appearance === "system" ? (systemDark ? "dark" : "light") : appearance;
