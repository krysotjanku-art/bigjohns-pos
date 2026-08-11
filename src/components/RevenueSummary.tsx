import "./RevenueSummary.css";

interface Props {
  withoutVat: number;
  vat: number;
  includingVat: number;
}

const money = (amount: number) => new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 0,
}).format(amount);

export function RevenueSummary({ withoutVat, vat, includingVat }: Props) {
  return <article className="revenue-summary">
    <h2>Přehled tržeb</h2>
    <div className="revenue-summary__table" role="table" aria-label="Přehled tržeb">
      <div role="row"><span role="cell">Bez DPH</span><strong role="cell">{money(withoutVat)}</strong></div>
      <div role="row"><span role="cell">DPH</span><strong role="cell">{money(vat)}</strong></div>
      <div className="revenue-summary__total" role="row"><span role="cell">Včetně DPH</span><strong role="cell">{money(includingVat)}</strong></div>
    </div>
  </article>;
}
