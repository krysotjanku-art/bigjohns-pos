import type { MouseEventHandler } from "react";
import "./BackToPosButton.css";

interface Props {
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export function BackToPosButton({ onClick }: Props) {
  return <button className="back-to-pos-button" type="button" onClick={onClick}><span aria-hidden="true">←</span><span>Zpět na pokladnu</span></button>;
}
