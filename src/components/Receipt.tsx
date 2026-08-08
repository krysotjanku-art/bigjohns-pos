import { calculateVatBreakdown, type ReceiptSnapshot } from "../receiptSnapshot";
import { orderItemKey } from "../order";
import "./Receipt.css";
import type { CompanySettings } from "../settings";

interface Props { receipt: ReceiptSnapshot | null; company?: CompanySettings; }

const money = (amount: number, decimals = 0) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
const dateTime = (date: Date) => new Intl.DateTimeFormat("cs-CZ", { dateStyle: "short", timeStyle: "short" }).format(date);
const itemName = (name: string) => name.replace(/^\d{2}\s+/, "");

export function Receipt({ receipt, company }: Props) {
  if (!receipt) return null;
  const vatTotals = receipt.vatBreakdown ?? calculateVatBreakdown(receipt.items);
  const companyInfo = company ?? { companyName: "BIG JOHN'S PIZZA", tradeName: "Bistro4you s.r.o.", address: "Bedřichov 146\n543 51 Špindlerův Mlýn", phone: "+420 777 706 666", ic: "10735941", dic: "CZ10735941", web: "www.bigjohnspizza.cz" }; void companyInfo;

  return <section className="receipt"><div className="receipt__rule">══════════════════════════════════════</div><header className="receipt__center"><strong>BIG JOHN&apos;S PIZZA</strong><br /><br />Bistro4you s.r.o.<br />Bedřichov 146<br />543 51 Špindlerův Mlýn<br /><br />Tel.: +420 777 706 666<br /><br />IČ: 10735941<br />DIČ: CZ10735941</header><div className="receipt__rule">══════════════════════════════════════</div>{receipt.isCancelled && <><div className="receipt__center"><strong>STORNO</strong></div><div className="receipt__line" /></>}<div>Poř. č. účtenky: {String(receipt.receiptNumber).padStart(6, "0")}</div><div>Číslo objednávky: {String(receipt.orderNumber).padStart(3, "0")}</div><br /><div>Obj.: {dateTime(receipt.issuedAt)}</div><div>Vystaveno: {dateTime(receipt.issuedAt)}</div><div className="receipt__line" /> <div className="receipt__items">{receipt.items.map((item) => <div className="receipt__item" key={orderItemKey(item)}><span>{item.pocet}× {itemName(item.nazev)}</span><span>{money(item.cena * item.pocet)}</span></div>)}</div><div className="receipt__line" /><div className="receipt__total"><strong>CELKEM</strong><strong>{money(receipt.total)}</strong></div><div className="receipt__vat-title">Přehled DPH</div><div className="receipt__line" /><div className="receipt__vat-head"><span>Sazba</span><span>Základ</span><span>DPH</span></div>{vatTotals.map(({ rate, base, vat }) => <div className="receipt__vat-row" key={rate}><span>{rate} %</span><span>{money(base, 2)}</span><span>{money(vat, 2)}</span></div>)}<div className="receipt__line" /><footer className="receipt__center">Děkujeme za návštěvu!<br /><br />www.bigjohnspizza.cz</footer><div className="receipt__rule">══════════════════════════════════════</div></section>;
}
