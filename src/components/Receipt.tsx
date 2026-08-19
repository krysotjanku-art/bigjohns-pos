import { calculateVatBreakdown, type ReceiptSnapshot } from "../receiptSnapshot";
import { orderItemKey } from "../order";
import { formatDateTime } from "../dateFormat";
import { paymentMethodLabel } from "../paymentMethod";
import { defaultSettings, type CompanySettings } from "../settings";
import "./Receipt.css";

interface Props { receipt: ReceiptSnapshot | null; company?: CompanySettings; }

const money = (amount: number, decimals = 0) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
const itemName = (name: string) => name.replace(/^\d{2}\s+/, "");

export function Receipt({ receipt, company = defaultSettings.company }: Props) {
  if (!receipt) return null;
  const vatTotals = receipt.vatBreakdown ?? calculateVatBreakdown(receipt.items);
  const totalBase = vatTotals.reduce((sum, entry) => sum + entry.base, 0);
  const totalVat = vatTotals.reduce((sum, entry) => sum + entry.vat, 0);
  const orderNumber = String(receipt.orderNumber).padStart(3, "0");

  return <section className="receipt">
    <header className="receipt__order-box"><strong>OBJEDNÁVKA</strong><b>{orderNumber}</b></header>
    <section className="receipt__center receipt__company"><strong>{company.companyName}</strong><br /><br />{company.tradeName}<br />{company.address.split("\n").map((line) => <span key={line}>{line}<br /></span>)}<br />Tel.: {company.phone}<br /><br />IČ: {company.ic}<br />DIČ: {company.dic}</section>
    <div className="receipt__rule" />
    {receipt.isCancelled && <><div className="receipt__center"><strong>STORNO</strong></div><div className="receipt__line" /></>}
    <div>Poř. č. účtenky: {String(receipt.receiptNumber).padStart(6, "0")}</div>
    <div>Číslo objednávky: {orderNumber}</div>
    <br />
    <div>Obj.: {formatDateTime(receipt.issuedAt)}</div>
    <div>Vystaveno: {formatDateTime(receipt.issuedAt)}</div>
    <div className="receipt__line" />
    <div className="receipt__items">{receipt.items.map((item) => <div className="receipt__item" key={orderItemKey(item)}><span>{item.pocet}× {itemName(item.nazev)}</span><span>{money(item.cena * item.pocet)}</span></div>)}</div>
    {receipt.discount && <><div className="receipt__line" /><div className="receipt__item"><span>Mezisoučet</span><span>{money(receipt.subtotal)}</span></div><div className="receipt__item"><span>Sleva{receipt.discount.type === "percentage" ? ` ${receipt.discount.percentage} %` : ""}</span><span>−{money(receipt.discount.amount)}</span></div><div className="receipt__line" /></>}
    <div className="receipt__total"><strong>CELKEM</strong><strong>{money(receipt.total)}</strong></div>
    <div className="receipt__payment">Platba: {paymentMethodLabel(receipt.paymentMethod ?? "cash")}</div>
    <div className="receipt__vat-title">Přehled DPH</div>
    <table className="receipt__vat-table"><thead><tr><th>Sazba</th><th>Základ</th><th>DPH</th><th>Celkem</th></tr></thead><tbody>{vatTotals.map(({ rate, base, vat }) => <tr key={rate}><td>{rate} %</td><td>{money(base, 2)}</td><td>{money(vat, 2)}</td><td>{money(base + vat, 2)}</td></tr>)}</tbody><tfoot><tr><th>CELKEM</th><th>{money(totalBase, 2)}</th><th>{money(totalVat, 2)}</th><th>{money(totalBase + totalVat, 2)}</th></tr></tfoot></table>
    <footer className="receipt__center">Děkujeme za návštěvu!<br /><br />{company.web}</footer>
  </section>;
}
