export const APPEARANCE_KEY = "bigjohns.appearance";
export const ACCENT_KEY = "bigjohns.accent";

export type Appearance = "light" | "dark" | "system";
export type Accent = "blue" | "green" | "red" | "purple" | "orange" | "pink" | "black" | "white" | "gray";

const appearances: readonly Appearance[] = ["light", "dark", "system"];
const accents: readonly Accent[] = ["blue", "green", "red", "purple", "orange", "pink", "black", "white", "gray"];

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

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

export const systemPrefersDark = (mediaQuery?: MediaQueryList) => mediaQuery?.matches ?? false;

export const subscribeToSystemAppearance = (
  mediaQuery: LegacyMediaQueryList | undefined,
  onChange: (dark: boolean) => void,
) => {
  if (!mediaQuery) return () => undefined;

  const listener = (event: MediaQueryListEvent) => onChange(event.matches);
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener?.("change", listener);
  }

  mediaQuery.addListener?.(listener);
  return () => mediaQuery.removeListener?.(listener);
};
