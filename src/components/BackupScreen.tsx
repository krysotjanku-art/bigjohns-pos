import { useRef, useState } from "react";
import { backupFilename, createBackup, parseBackup, restoreBackup } from "../backup";

interface Props { onBackToPos: () => void; }

export function BackupScreen({ onBackToPos }: Props) {
  const fileInput = useRef<HTMLInputElement>(null); const [error, setError] = useState("");
  const exportBackup = () => { const now = new Date(); const blob = new Blob([JSON.stringify(createBackup(localStorage, now), null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = backupFilename(now); link.click(); URL.revokeObjectURL(url); };
  const importBackup = (file: File | undefined) => { if (!file) return; const reader = new FileReader(); reader.onload = () => { const backup = parseBackup(String(reader.result)); if (!backup) { setError("Neplatný nebo nekompatibilní soubor zálohy."); return; } if (!window.confirm("Obnovením zálohy budou nahrazena aktuální uložená data. Pokračovat?")) return; restoreBackup(localStorage, backup); window.location.reload(); }; reader.onerror = () => setError("Soubor zálohy se nepodařilo načíst."); reader.readAsText(file); };
  return <section><button type="button" onClick={onBackToPos}>← Zpět na pokladnu</button><h1>Záloha</h1><p>Exportujte data POS do souboru nebo obnovte dříve vytvořenou zálohu.</p><div style={{ display: "flex", gap: 12, marginTop: 24 }}><button type="button" onClick={exportBackup} style={{ padding: "12px 20px", fontSize: 18 }}>Exportovat zálohu</button><button type="button" onClick={() => fileInput.current?.click()} style={{ padding: "12px 20px", fontSize: 18 }}>Obnovit ze zálohy</button><input ref={fileInput} type="file" accept="application/json,.json" onChange={(event) => importBackup(event.target.files?.[0])} style={{ display: "none" }} /></div>{error && <p role="alert" style={{ color: "#b00020", marginTop: 16 }}>{error}</p>}</section>;
}
