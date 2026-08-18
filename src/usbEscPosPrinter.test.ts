import { describe, expect, it } from "vitest";
import { receiptEscPosText } from "./usbEscPosPrinter";
import type { ReceiptSnapshot } from "./receiptSnapshot";

const ESC = "\x1B";
const GS = "\x1D";

describe("USB ESC/POS receipt", () => {
  const receipt: ReceiptSnapshot = {
    issuedAt: new Date("2026-08-12T10:30:00"),
    receiptNumber: 154,
    orderNumber: 23,
    paymentMethod: "cash",
    subtotal: 112,
    total: 112,
    items: [{ id: 1, cislo: "01", nazev: "01 Margherita S", cena: 112, pocet: 1, kategorie: "Pizza", vatRate: 12 }],
    vatBreakdown: [{ rate: 12, base: 100, vat: 12 }],
  };

  it("prints the order identity, item, payment, total and VAT summary", () => {
    const text = receiptEscPosText(receipt);

    expect(text).toContain("Poř. č. účtenky: 000154");
    expect(text).toContain("Číslo objednávky: 023");
    expect(text).toContain("1× Margherita S");
    expect(text).toContain("CELKEM");
    expect(text).toContain("Platba: Hotově");
    expect(text).toContain("Přehled DPH");
    expect(text).toContain("Sazba");
  });

  it("uses a centred inverted order-number box and safe five-line margins", () => {
    const text = receiptEscPosText(receipt);

    expect(text).toContain(`${ESC}3 ${ESC}d\x05`);
    expect(text).toContain(`${GS}B\x01`);
    expect(text).toContain("OBJEDNÁVKA");
    expect(text).toContain("023");
    expect(text).toContain(`${GS}B\x00`);
    expect(text).toContain(`${ESC}2${ESC}d\x05`);
    expect(text.lastIndexOf("www.bigjohnspizza.cz")).toBeLessThan(text.lastIndexOf(`${ESC}2${ESC}d\x05`));
  });
});
