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
const money = (amount: number, decimals = 0) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
const line = "------------------------------------------";
const itemName = (name: string) => name.replace(/^\d{2}\s+/, "");
const row = (left: string, right: string) => `${left.slice(0, 27).padEnd(27, " ")}${right.padStart(15, " ")}`;

export const isNativeUsbPrintingAvailable = () => Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform();

export const receiptEscPosText = (receipt: ReceiptSnapshot) => {
  const vatTotals = receipt.vatBreakdown ?? calculateVatBreakdown(receipt.items);
  const lines = [
    "             BIG JOHN'S PIZZA",
    "",
    "Bistro4you s.r.o.",
    "Bedřichov 146",
    "543 51 Špindlerův Mlýn",
    "",
    "Tel.: +420 777 706 666",
    "IČ: 10735941",
    "DIČ: CZ10735941",
    line,
    ...(receipt.isCancelled ? ["                 STORNO", line] : []),
    `Poř. č. účtenky: ${String(receipt.receiptNumber).padStart(6, "0")}`,
    `Číslo objednávky: ${String(receipt.orderNumber).padStart(3, "0")}`,
    "",
    `Obj.: ${formatDateTime(receipt.issuedAt)}`,
    `Vystaveno: ${formatDateTime(receipt.issuedAt)}`,
    line,
    ...receipt.items.flatMap((item) => [row(`${item.pocet}× ${itemName(item.nazev)}`, money(item.cena * item.pocet))]),
    ...(receipt.discount ? [line, row("Mezisoučet", money(receipt.subtotal)), row(`Sleva${receipt.discount.type === "percentage" ? ` ${receipt.discount.percentage} %` : ""}`, `−${money(receipt.discount.amount)}`), line] : []),
    row("CELKEM", money(receipt.total)),
    `Platba: ${paymentMethodLabel(receipt.paymentMethod ?? "cash")}`,
    "",
    "Přehled DPH",
    line,
    "Sazba          Základ             DPH",
    ...vatTotals.map(({ rate, base, vat }) => `${`${rate} %`.padEnd(12, " ")}${money(base, 2).padStart(13, " ")}${money(vat, 2).padStart(17, " ")}`),
    line,
    "Děkujeme za návštěvu!",
    "www.bigjohnspizza.cz",
  ];
  return `${lines.join("\n")}\n`;
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
