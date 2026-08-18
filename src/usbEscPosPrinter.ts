import { Capacitor, registerPlugin } from "@capacitor/core";
import type { ReceiptSnapshot } from "./receiptSnapshot";
import { calculateVatBreakdown } from "./receiptSnapshot";
import { formatDateTime } from "./dateFormat";
import { paymentMethodLabel } from "./paymentMethod";

export interface PrinterStatus {
  connected: boolean;
  permissionGranted: boolean;
  printerName?: string;
  message: string;
}

interface UsbEscPosPrinterPlugin {
  getStatus(): Promise<PrinterStatus>;
  print(options: { content: string }): Promise<{ printerName: string }>;
}

const nativePrinter = registerPlugin<UsbEscPosPrinterPlugin>("UsbEscPosPrinter");
const ESC = "\x1B";
const GS = "\x1D";
const line = "------------------------------------------";
const money = (amount: number, decimals = 0) => new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
}).format(amount);
const itemName = (name: string) => name.replace(/^\d{2}\s+/, "");
const row = (left: string, right: string) => `${left.slice(0, 27).padEnd(27, " ")}${right.padStart(15, " ")}`;
const center = (value: string, width: number) => {
  const padding = Math.max(0, width - value.length);
  const left = Math.floor(padding / 2);
  return `${" ".repeat(left)}${value}${" ".repeat(padding - left)}`;
};
const feed = (lines: number) => `${ESC}d${String.fromCharCode(lines)}`;
const align = (value: 0 | 1 | 2) => `${ESC}a${String.fromCharCode(value)}`;
const bold = (enabled: boolean) => `${ESC}E${String.fromCharCode(enabled ? 1 : 0)}`;
const inverse = (enabled: boolean) => `${GS}B${String.fromCharCode(enabled ? 1 : 0)}`;
const size = (width: number, height: number) => `${GS}!${String.fromCharCode(((width - 1) << 4) | (height - 1))}`;
const lineHeight = (dots: number) => `${ESC}3${String.fromCharCode(dots)}`;
const defaultLineHeight = `${ESC}2`;
const vatRow = (rate: string, base: string, vat: string, total: string) => `${rate.padEnd(6, " ")}${base.padStart(12, " ")}${vat.padStart(12, " ")}${total.padStart(12, " ")}`;

export const isNativeUsbPrintingAvailable = () => Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform();

/** A single, self-contained ESC/POS payload. The native plugin appends the final cut only once. */
export const receiptEscPosText = (receipt: ReceiptSnapshot) => {
  const vatTotals = receipt.vatBreakdown ?? calculateVatBreakdown(receipt.items);
  const totalBase = vatTotals.reduce((sum, entry) => sum + entry.base, 0);
  const totalVat = vatTotals.reduce((sum, entry) => sum + entry.vat, 0);
  const totalGross = totalBase + totalVat;
  const orderNumber = String(receipt.orderNumber).padStart(3, "0");
  const vatTable = [
    vatRow("Sazba", "Základ", "DPH", "Celkem"),
    ...vatTotals.map(({ rate, base, vat }) => vatRow(`${rate} %`, money(base, 2), money(vat, 2), money(base + vat, 2))),
    vatRow("CELKEM", money(totalBase, 2), money(totalVat, 2), money(totalGross, 2)),
  ];

  return [
    lineHeight(32),
    feed(5),
    align(1),
    inverse(true),
    bold(true),
    size(1, 1), `${center("OBJEDNÁVKA", 20)}\n`,
    size(2, 2), `${center(orderNumber, 20)}\n`,
    size(1, 1),
    bold(false),
    inverse(false),
    "\n",
    bold(true), size(2, 1), "BIG JOHN'S PIZZA\n", size(1, 1), bold(false),
    "Bistro4you s.r.o.\n",
    "Bedřichov 146\n",
    "543 51 Špindlerův Mlýn\n",
    "Tel.: +420 777 706 666\n",
    "IČ: 10735941\n",
    "DIČ: CZ10735941\n",
    `${line}\n`,
    ...(receipt.isCancelled ? [bold(true), "STORNO\n", bold(false), `${line}\n`] : []),
    align(0),
    `Poř. č. účtenky: ${String(receipt.receiptNumber).padStart(6, "0")}\n`,
    `Číslo objednávky: ${orderNumber}\n`,
    `Obj.: ${formatDateTime(receipt.issuedAt)}\n`,
    `Vystaveno: ${formatDateTime(receipt.issuedAt)}\n`,
    `${line}\n`,
    ...receipt.items.flatMap((item) => [`${row(`${item.pocet}× ${itemName(item.nazev)}`, money(item.cena * item.pocet))}\n`]),
    ...(receipt.discount ? [
      `${line}\n`,
      `${row("Mezisoučet", money(receipt.subtotal))}\n`,
      `${row(`Sleva${receipt.discount.type === "percentage" ? ` ${receipt.discount.percentage} %` : ""}`, `−${money(receipt.discount.amount)}`)}\n`,
      `${line}\n`,
    ] : []),
    "\n",
    bold(true), `${row("CELKEM", money(receipt.total))}\n`, bold(false),
    `Platba: ${paymentMethodLabel(receipt.paymentMethod ?? "cash")}\n`,
    "\n",
    "Přehled DPH\n",
    `${line}\n`,
    ...vatTable.map((entry) => `${entry}\n`),
    `${line}\n`,
    align(1),
    "Děkujeme za návštěvu!\n",
    "www.bigjohnspizza.cz\n",
    defaultLineHeight,
    feed(5),
  ].join("");
};

export const printerStatus = async (): Promise<PrinterStatus> => {
  if (!isNativeUsbPrintingAvailable()) return { connected: false, permissionGranted: false, message: "USB tisk je dostupný pouze v Android aplikaci." };
  return nativePrinter.getStatus();
};

export const printEscPosReceipt = async (receipt: ReceiptSnapshot) => {
  if (!isNativeUsbPrintingAvailable()) return false;
  await nativePrinter.print({ content: receiptEscPosText(receipt) });
  return true;
};

export const testReceipt = (): ReceiptSnapshot => ({
  issuedAt: new Date(), receiptNumber: 0, orderNumber: 0, paymentMethod: "cash", items: [], subtotal: 0, total: 0, vatBreakdown: [],
});
