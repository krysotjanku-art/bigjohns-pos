import { describe, expect, it } from "vitest";
import { defaultSettings, loadSettings, menuWithSettings, saveSettings } from "./settings";

const storage = () => { let value: string | null = null; return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } }; };
describe("settings", () => {
  it("saves and restores settings", () => { const local = storage(); const settings = { ...defaultSettings, company: { ...defaultSettings.company, companyName: "Nová firma" }, prices: { ...defaultSettings.prices, 601: 75 } }; saveSettings(local, settings); expect(loadSettings(local)).toEqual(settings); });
  it("uses updated prices only for future menu items", () => { const settings = { ...defaultSettings, prices: { ...defaultSettings.prices, 601: 75 } }; expect(menuWithSettings(settings).find((item) => item.id === 601)?.cena).toBe(75); });
});
