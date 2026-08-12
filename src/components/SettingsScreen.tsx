import { useState, type FormEvent } from "react";
import { BackToPosButton } from "./BackToPosButton";
import type { Accent, Appearance } from "../appearance";
import { defaultSettings, type PosSettings, validSettings } from "../settings";
import { menu } from "../data/menu";
import "./SettingsScreen.css";

interface Props {
  settings: PosSettings;
  appearance: Appearance;
  accent: Accent;
  onAppearanceChange: (appearance: Appearance) => void;
  onAccentChange: (accent: Accent) => void;
  onChangePin: (current: string, next: string, confirm: string) => string | null;
  onSave: (settings: PosSettings) => void;
  onBackToPos: () => void;
}

const groups = [["Káva", 201, 208], ["Toppingy", 401, 406], ["Krabice", 501, 503], ["Rozvoz", 601, 604]] as const;
const accentOptions: ReadonlyArray<{ value: Accent; label: string; icon: string }> = [
  { value: "blue", label: "Blue", icon: "🔵" },
  { value: "green", label: "Green", icon: "🟢" },
  { value: "red", label: "Red", icon: "🔴" },
  { value: "purple", label: "Purple", icon: "🟣" },
  { value: "orange", label: "Orange", icon: "🟠" },
  { value: "pink", label: "Pink", icon: "🩷" },
];

export function SettingsScreen({ settings, appearance, accent, onAppearanceChange, onAccentChange, onChangePin, onSave, onBackToPos }: Props) {
  const [draft, setDraft] = useState(settings);
  const [error, setError] = useState("");
  const [pin, setPin] = useState({ current: "", next: "", confirm: "" });
  const [pinMessage, setPinMessage] = useState("");
  const save = () => { if (!validSettings(draft)) { setError("Vyplňte název firmy a platné nezáporné ceny a sazby DPH."); return; } onSave(draft); };
  const submitPin = (event: FormEvent) => { event.preventDefault(); const result = onChangePin(pin.current, pin.next, pin.confirm); setPinMessage(result ?? "PIN byl úspěšně změněn."); if (!result) setPin({ current: "", next: "", confirm: "" }); };

  return <section className="settings-ui"><BackToPosButton onClick={onBackToPos}/><h1>Nastavení</h1><article><h2>Vzhled</h2><div className="settings-ui__appearance">{([['light', 'Světlý'], ['dark', 'Tmavý'], ['system', 'Podle systému']] as const).map(([value, label]) => <button className={appearance === value ? "active" : ""} onClick={() => onAppearanceChange(value)} key={value}>{label}</button>)}</div><div className="settings-ui__accent"><h3>🎨 Accent Color</h3><div>{accentOptions.map(({ value, label, icon }) => <button className={accent === value ? "active" : ""} onClick={() => onAccentChange(value)} key={value}><span aria-hidden="true">{icon}</span>{label}</button>)}</div></div></article><article><h2>Změna PINu</h2><form className="settings-ui__fields" onSubmit={submitPin}><label>Současný PIN<input autoComplete="current-password" inputMode="numeric" maxLength={4} type="password" value={pin.current} onChange={event => setPin({ ...pin, current: event.target.value.replace(/\D/g, "") })}/></label><label>Nový PIN<input inputMode="numeric" maxLength={4} type="password" value={pin.next} onChange={event => setPin({ ...pin, next: event.target.value.replace(/\D/g, "") })}/></label><label>Potvrdit nový PIN<input inputMode="numeric" maxLength={4} type="password" value={pin.confirm} onChange={event => setPin({ ...pin, confirm: event.target.value.replace(/\D/g, "") })}/></label><button type="submit">Změnit PIN</button></form>{pinMessage && <p role="status">{pinMessage}</p>}</article><article><h2>Firma</h2><div className="settings-ui__fields">{([['companyName', 'Název firmy'], ['tradeName', 'Obchodní název'], ['address', 'Adresa'], ['phone', 'Telefon'], ['ic', 'IČ'], ['dic', 'DIČ'], ['web', 'Web']] as const).map(([key, label]) => <label key={key}>{label}<input value={draft.company[key]} onChange={event => setDraft({ ...draft, company: { ...draft.company, [key]: event.target.value } })}/></label>)}</div></article><article><h2>DPH</h2><div className="settings-ui__fields"><label>Reduced VAT<input type="number" value={draft.reducedVat} onChange={event => setDraft({ ...draft, reducedVat: Number(event.target.value) })}/></label><label>Standard VAT<input type="number" value={draft.standardVat} onChange={event => setDraft({ ...draft, standardVat: Number(event.target.value) })}/></label></div></article><article><h2>Ceny</h2>{groups.map(([title, min, max]) => <div className="settings-ui__price" key={title}><h3>{title}</h3>{menu.filter(item => item.id >= min && item.id <= max).map(item => <label key={item.id}>{item.nazev}<input type="number" min="0" value={draft.prices[item.id]} onChange={event => setDraft({ ...draft, prices: { ...draft.prices, [item.id]: Number(event.target.value) } })}/></label>)}</div>)}</article><article><h2>Reset</h2><div className="settings-ui__actions"><button onClick={save}>Uložit nastavení</button><button className="danger" onClick={() => { if (window.confirm("Opravdu chcete obnovit výchozí nastavení?")) { setDraft(defaultSettings); onSave(defaultSettings); } }}>Obnovit výchozí nastavení</button></div>{error && <p role="alert">{error}</p>}</article></section>;
}
