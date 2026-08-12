import { describe, expect, it } from "vitest";
import { receiptEscPosText } from "./usbEscPosPrinter";
import type { ReceiptSnapshot } from "./receiptSnapshot";

describe("USB ESC/POS receipt", () => {
  it("preserves receipt identity, items, payment, total and VAT in raw printer text", () => {
    const receipt: ReceiptSnapshot = { issuedAt: new Date("2026-08-12T10:30:00"), receiptNumber: 154, orderNumber: 23, paymentMethod: "cash", subtotal: 112, total: 112, items: [{ id: 1, cislo: "01", nazev: "01 Margherita S", cena: 112, pocet: 1, kategorie: "Pizza", vatRate: 12 }], vatBreakdown: [{ rate: 12, base: 100, vat: 12 }] };
    const text = receiptEscPosText(receipt);
    expect(text).toContain("Poř. č. účtenky: 000154");
    expect(text).toContain("Číslo objednávky: 023");
    expect(text).toContain("1× Margherita S");
    expect(text).toContain("CELKEM");
    expect(text).toContain("112 Kč");
    expect(text).toContain("Platba: Hotově");
    expect(text).toContain("Přehled DPH");
  });
});
