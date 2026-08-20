import { Capacitor, registerPlugin } from "@capacitor/core";
import { calculateVatBreakdown, type ReceiptSnapshot } from "./receiptSnapshot";
import { formatDateTime } from "./dateFormat";
import { paymentMethodLabel } from "./paymentMethod";
import { defaultSettings, type CompanySettings } from "./settings";
import type { DailySummary } from "./dailySummary";
import type { OrderItem } from "./types/menu";

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
const RECEIPT_WIDTH = 42;
const line = "-".repeat(RECEIPT_WIDTH);
const money = (amount: number, decimals = 0) => new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
}).format(amount);
const tableMoney = (amount: number) => `${amount.toFixed(2).replace(".", ",")} Kč`;
const itemName = (name: string) => name.replace(/^\d{2}\s+/, "");
const row = (left: string, right: string) => `${left.slice(0, 27).padEnd(27, " ")}${right.padStart(15, " ")}`;
const center = (value: string, width = RECEIPT_WIDTH) => {
  const padding = Math.max(0, width - value.length);
  const left = Math.floor(padding / 2);
  return `${" ".repeat(left)}${value}${" ".repeat(padding - left)}`;
};
const feed = (lines: number) => `${ESC}d${String.fromCharCode(lines)}`;
const align = (value: 0 | 1 | 2) => `${ESC}a${String.fromCharCode(value)}`;
const bold = (enabled: boolean) => `${ESC}E${String.fromCharCode(enabled ? 1 : 0)}`;
const inverse = (enabled: boolean) => `${GS}B${String.fromCharCode(enabled ? 1 : 0)}`;
const size = (width: number, height: number) => `${GS}!${String.fromCharCode(((width - 1) << 4) | (height - 1))}`;
const font = (value: 0 | 1) => `${ESC}M${String.fromCharCode(value)}`;
const lineHeight = (dots: number) => `${ESC}3${String.fromCharCode(dots)}`;
const defaultLineHeight = `${ESC}2`;
const tableWidths = [7, 14, 14, 14] as const;
const tableBorder = `+${tableWidths.map((width) => "-".repeat(width)).join("+")}+`;
const tableCell = (value: string, width: number, left = false) => {
  const safe = value.replace(/\u00a0/g, " ");
  return left ? safe.slice(0, width).padEnd(width, " ") : safe.slice(0, width).padStart(width, " ");
};
const tableRow = (values: readonly string[]) => `|${values.map((value, index) => tableCell(value, tableWidths[index], index === 0)).join("|")}|`;

const vatTable = (receipt: ReceiptSnapshot) => {
  const vatTotals = receipt.vatBreakdown ?? calculateVatBreakdown(receipt.items);
  const totalBase = vatTotals.reduce((sum, entry) => sum + entry.base, 0);
  const totalVat = vatTotals.reduce((sum, entry) => sum + entry.vat, 0);
  const totalGross = totalBase + totalVat;
  return [
    tableBorder,
    tableRow(["Sazba", "Základ", "DPH", "Celkem"]),
    tableBorder,
    ...vatTotals.map(({ rate, base, vat }) => tableRow([`${rate} %`, tableMoney(base), tableMoney(vat), tableMoney(base + vat)])),
    tableBorder,
    tableRow(["CELKEM", tableMoney(totalBase), tableMoney(totalVat), tableMoney(totalGross)]),
    tableBorder,
  ];
};

const companyLines = (company: CompanySettings) => [
  company.tradeName,
  ...company.address.split("\n"),
  `Tel.: ${company.phone}`,
  `IČ: ${company.ic}`,
  `DIČ: ${company.dic}`,
].filter(Boolean);

/** A single ESC/POS payload: feed, inverse order box, body, footer, feed, then native code cuts once. */
export const receiptEscPosText = (receipt: ReceiptSnapshot, company: CompanySettings = defaultSettings.company) => {
  const orderNumber = String(receipt.orderNumber).padStart(3, "0");
  const orderBox = [
    `${" ".repeat(RECEIPT_WIDTH)}\n`,
    `${center("OBJEDNÁVKA")}\n`,
    size(2, 2), `${center(orderNumber, RECEIPT_WIDTH / 2)}\n`, size(1, 1),
    `${" ".repeat(RECEIPT_WIDTH)}\n`,
  ];

  return [
    lineHeight(32),
    feed(5),
    align(1),
    inverse(true),
    bold(true),
    ...orderBox,
    bold(false),
    inverse(false),
    "\n",
    bold(true), size(2, 1), `${company.companyName}\n`, size(1, 1), bold(false),
    ...companyLines(company).map((value) => `${value}\n`),
    `${line}\n`,
    ...(receipt.isCancelled ? [bold(true), "STORNO\n", bold(false), `${line}\n`] : []),
    align(0),
    `Poř. č. účtenky: ${String(receipt.receiptNumber).padStart(6, "0")}\n`,
    `Číslo objednávky: ${orderNumber}\n`,
    `Obj.: ${formatDateTime(receipt.issuedAt)}\n`,
    `Vystaveno: ${formatDateTime(receipt.issuedAt)}\n`,
    `${line}\n`,
    ...receipt.items.map((item) => `${row(`${item.pocet}× ${itemName(item.nazev)}`, money(item.cena * item.pocet))}\n`),
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
    font(1),
    ...vatTable(receipt).map((entry) => `${entry}\n`),
    font(0),
    "\n",
    align(1),
    "Děkujeme za návštěvu!\n",
    `${company.web}\n`,
    defaultLineHeight,
    feed(5),
  ].join("");
};

export const isNativeUsbPrintingAvailable = () => Capacitor.getPlatform() === "android" && Capacitor.isNativePlatform();

export const printerStatus = async (): Promise<PrinterStatus> => {
  if (!isNativeUsbPrintingAvailable()) return { connected: false, permissionGranted: false, message: "USB tisk je dostupný pouze v Android aplikaci." };
  return nativePrinter.getStatus();
};

export const printEscPosReceipt = async (receipt: ReceiptSnapshot, company?: CompanySettings) => {
  if (!isNativeUsbPrintingAvailable()) return false;
  await nativePrinter.print({ content: receiptEscPosText(receipt, company) });
  return true;
};

const vatBase = (vat: number, rate: number) => vat * 100 / rate;

/** Uses the same native ESC/POS transport, feed, and final cut as customer receipts. */
export const dailySummaryEscPosText = (summary: DailySummary, issuedAt: Date, company: CompanySettings = defaultSettings.company) => {
  const reducedBase = vatBase(summary.vat12, 12);
  const standardBase = vatBase(summary.vat21, 21);

  return [
    lineHeight(32),
    feed(4),
    align(1),
    bold(true), size(2, 1), `${company.companyName}\n`, size(1, 1), bold(false),
    ...companyLines(company).map((value) => `${value}\n`),
    `${line}\n`,
    bold(true), "DENNÍ PŘEHLED\n", bold(false),
    align(0),
    `Datum: ${formatDateTime(issuedAt).slice(0, 10)}\n`,
    `Vystaveno: ${formatDateTime(issuedAt)}\n`,
    `${line}\n`,
    `Počet objednávek: ${summary.orderCount}\n`,
    `${row("Tržba celkem", money(summary.grossRevenue))}\n`,
    `Stornované objednávky: ${summary.cancelledOrderCount}\n`,
    `${row("Hodnota storen", money(summary.cancelledValue))}\n`,
    `${line}\n`,
    bold(true), `${row("TRŽBA PO ODEČTENÍ STOREN", money(summary.netRevenue))}\n`, bold(false),
    "\nPřehled tržeb\n",
    `${row("Bez DPH", money(summary.revenueWithoutVat))}\n`,
    `${row("DPH", money(summary.totalVat))}\n`,
    bold(true), `${row("Včetně DPH", money(summary.revenueIncludingVat))}\n`, bold(false),
    "\nDPH\n",
    `${row("Základ 12 %", tableMoney(reducedBase))}\n`,
    `${row("DPH 12 %", tableMoney(summary.vat12))}\n`,
    `${row("Základ 21 %", tableMoney(standardBase))}\n`,
    `${row("DPH 21 %", tableMoney(summary.vat21))}\n`,
    `${line}\n`,
    "PRODEJE\n",
    `Pizzy: ${summary.pizzas}\n`,
    `Přílohy: ${summary.sides}\n`,
    `Nápoje: ${summary.drinks}\n`,
    `Káva: ${summary.coffees}\n`,
    `Toppingy: ${summary.toppings}\n`,
    `Krabice: ${summary.boxes}\n`,
    `Rozvozy: ${summary.deliveries}\n`,
    `${line}\n`,
    align(1),
    "Děkujeme za návštěvu!\n",
    `${company.web}\n`,
    defaultLineHeight,
    feed(5),
  ].join("");
};

export const printEscPosDailySummary = async (summary: DailySummary, issuedAt: Date, company?: CompanySettings) => {
  if (!isNativeUsbPrintingAvailable()) return false;
  await nativePrinter.print({ content: dailySummaryEscPosText(summary, issuedAt, company) });
  return true;
};

export const testReceipt = (): ReceiptSnapshot => {
  const items: OrderItem[] = [
    { id: 1, cislo: "01", nazev: "01 Margherita M", cena: 189, pocet: 1, kategorie: "Pizza", vatRate: 12 },
    { id: 101, nazev: "Coca-Cola Zero", cena: 49, pocet: 1, kategorie: "Nápoje", vatRate: 21 },
  ];
  return { issuedAt: new Date(), receiptNumber: 0, orderNumber: 0, paymentMethod: "cash", items, subtotal: 238, total: 238, vatBreakdown: calculateVatBreakdown(items) };
};
