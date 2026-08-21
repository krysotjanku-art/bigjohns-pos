import { describe, expect, it } from "vitest";
import { dailySummaryEscPosText, internalOrderSlipEscPosText, receiptEscPosText, testReceipt } from "./usbEscPosPrinter";
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

  it("prints a four-column ASCII VAT table for both customer and test receipts", () => {
    const customerText = receiptEscPosText(receipt);
    const testText = receiptEscPosText(testReceipt());

    expect(customerText).toContain("+-------+--------------+--------------+--------------+");
    expect(customerText).toContain("|Sazba");
    expect(customerText).toContain("|CELKEM");
    expect(testText).toContain("Margherita M");
    expect(testText).toContain("Coca-Cola Zero");
    expect(testText).toContain("|CELKEM");
  });

  it("formats the daily report as one native ESC/POS receipt", () => {
    const text = dailySummaryEscPosText({
      orderCount: 3, grossRevenue: 600, cancelledOrderCount: 1, cancelledValue: 100, netRevenue: 500,
      vat12: 24, vat21: 42, revenueWithoutVat: 434, totalVat: 66, revenueIncludingVat: 500,
      pizzas: 2, sides: 1, drinks: 2, coffees: 0, toppings: 0, boxes: 1, deliveries: 0, bestSellingPizza: null,
    }, new Date("2026-08-20T10:30:00"));

    expect(text).toContain("DENN");
    expect(text).toContain("Po");
    expect(text).toContain("PRODEJE");
    expect(text).toContain(`${ESC}d\x07`);
  });

  it("formats a separate internal slip with the order identity and preparation contents only", () => {
    const text = internalOrderSlipEscPosText({
      ...receipt,
      items: [{ ...receipt.items[0], selectedOptions: ["Extra sýr"] }, { id: 11, nazev: "Krabice M", cena: 15, pocet: 1, kategorie: "Krabice", vatRate: 21 }],
    });

    expect(text).toContain("OBJEDNÁVKA");
    expect(text).toContain("023");
    expect(text).toContain("Datum: 12.08.2026");
    expect(text).toContain("Čas: 10:30");
    expect(text).toContain("OBSAH OBJEDNÁVKY");
    expect(text).toContain("1× 01 Margherita S");
    expect(text).toContain("  + Extra sýr");
    expect(text).toContain("1× Krabice M");
    expect(text).not.toContain("CELKEM");
    expect(text).not.toContain("Platba:");
    expect(text).not.toContain("Přehled DPH");
    expect(text).toContain(`${ESC}d\x05`);
  });
});
