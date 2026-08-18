import { describe, expect, it } from "vitest";
import { ACCENT_KEY, APPEARANCE_KEY, loadAccent, loadAppearance, resolveAppearance, saveAccent, saveAppearance, subscribeToSystemAppearance, systemPrefersDark } from "./appearance";

describe("appearance", () => {
  it("persists a selected appearance", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) };
    saveAppearance(storage, "dark");
    expect(store.get(APPEARANCE_KEY)).toBe("dark");
    expect(loadAppearance(storage)).toBe("dark");
  });

  it("persists a selected accent and defaults invalid values to red", () => {
    const store = new Map<string, string>();
    const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) };
    saveAccent(storage, "pink");
    expect(store.get(ACCENT_KEY)).toBe("pink");
    expect(loadAccent(storage)).toBe("pink");
    expect(loadAccent({ getItem: () => "invalid" })).toBe("red");
  });

  it("resolves system preference and explicit choices", () => {
    expect(resolveAppearance("system", true)).toBe("dark");
    expect(resolveAppearance("system", false)).toBe("light");
    expect(resolveAppearance("light", true)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
  });

  it("supports Android 7's MediaQueryList listener API", () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    const query = {
      matches: true,
      addListener: (next: (event: MediaQueryListEvent) => void) => { listener = next; },
      removeListener: () => { listener = undefined; },
    } as unknown as MediaQueryList;
    const values: boolean[] = [];
    const unsubscribe = subscribeToSystemAppearance(query, (dark) => values.push(dark));

    expect(systemPrefersDark(query)).toBe(true);
    listener?.({ matches: false } as MediaQueryListEvent);
    expect(values).toEqual([false]);
    unsubscribe();
    expect(listener).toBeUndefined();
  });

  it("defaults invalid preferences to system", () => expect(loadAppearance({ getItem: () => "invalid" })).toBe("system"));
});
