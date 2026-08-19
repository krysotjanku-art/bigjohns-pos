import { describe, expect, it } from "vitest";
import { defaultOtherMenu, loadOtherMenu } from "./pizzaMenu";

const storage = (value: string | null) => ({
  getItem: () => value,
});

describe("side-item names", () => {
  it("uses plain names for default side dishes and migrates saved emoji names", () => {
    expect(defaultOtherMenu().filter((item) => item.kategorie === "Přílohy").map((item) => item.nazev)).toEqual([
      "Slice", "Garlic Bread 3 ks", "Garlic Bread 7 ks", "Chilli Mayo", "Garlic Mayo", "Ketchup",
    ]);

    const saved = defaultOtherMenu().map((item) => item.id === 701 ? { ...item, nazev: "🍕 Slice" } : item);
    expect(loadOtherMenu(storage(JSON.stringify(saved))).find((item) => item.id === 701)?.nazev).toBe("Slice");
  });
});
