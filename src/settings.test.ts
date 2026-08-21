import { describe, expect, it } from "vitest";
import { defaultSettings, loadSettings, menuWithSettings, saveSettings } from "./settings";

const storage = () => {
  let value: string | null = null;
  return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
};

describe("settings", () => {
  it("saves and restores settings", () => {
    const local = storage();
    const settings = { ...defaultSettings, pinEnabled: true, company: { ...defaultSettings.company, companyName: "Nová firma" }, prices: { ...defaultSettings.prices, 601: 75 } };
    saveSettings(local, settings);
    expect(loadSettings(local)).toEqual(settings);
  });

  it("keeps PIN protection enabled for existing saved settings without the new value", () => {
    const local = storage();
    local.setItem("bigjohns.settings", JSON.stringify({ company: defaultSettings.company, reducedVat: 12, standardVat: 21, prices: defaultSettings.prices }));
    expect(loadSettings(local).pinEnabled).toBe(true);
  });

  it("persists the PIN protection preference", () => {
    const local = storage();
    saveSettings(local, { ...defaultSettings, pinEnabled: false });
    expect(loadSettings(local).pinEnabled).toBe(false);
  });

  it("uses updated prices only for future menu items", () => {
    const settings = { ...defaultSettings, prices: { ...defaultSettings.prices, 601: 75 } };
    expect(menuWithSettings(settings).find((item) => item.id === 601)?.cena).toBe(75);
  });
});
