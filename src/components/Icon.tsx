import type { ReactElement } from "react";

export type PosIcon = "pizza" | "sides" | "drink" | "coffee" | "dessert" | "topping" | "box" | "delivery" | "order" | "pause" | "history" | "trash" | "palette" | "star";

interface Props { name: PosIcon; className?: string; }

const paths: Record<PosIcon, ReactElement> = {
  pizza: <><circle cx="12" cy="12" r="8" /><circle cx="9" cy="9" r="1" fill="currentColor" /><circle cx="15" cy="11" r="1" fill="currentColor" /><circle cx="12" cy="15" r="1" fill="currentColor" /></>,
  sides: <><path d="M4 5h16l-2 14H6L4 5Z" /><path d="M8 5V3m8 2V3M8 10h8" /></>,
  drink: <><path d="M8 3h8l-1 18H9L8 3Z" /><path d="M7 7h10M12 3v-2" /></>,
  coffee: <><path d="M5 7h11v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V7Z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2M7 3c1 1 1 2 0 3m4-3c1 1 1 2 0 3" /></>,
  dessert: <><path d="M5 9h14l-1 10H6L5 9Z" /><path d="M7 9c0-3 2-5 5-5s5 2 5 5" /><circle cx="10" cy="13" r=".8" fill="currentColor" /><circle cx="14" cy="15" r=".8" fill="currentColor" /></>,
  topping: <><circle cx="12" cy="12" r="7" /><path d="M12 5v14M5 12h14" /></>,
  box: <><path d="m4 8 8-4 8 4v9l-8 4-8-4V8Z" /><path d="m4 8 8 4 8-4M12 12v9" /></>,
  delivery: <><path d="M3 7h11v10H3zM14 10h3l3 3v4h-6z" /><circle cx="7" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
  order: <><path d="M7 3h10v18H7z" /><path d="M9 7h6M9 11h6M9 15h4" /></>,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  history: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  trash: <><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" /></>,
  palette: <><path d="M12 4a8 8 0 1 0 0 16h1a2 2 0 0 0 0-4h-1a1 1 0 0 1 0-2h2a6 6 0 0 0-2-10Z" /><circle cx="8" cy="10" r=".8" fill="currentColor" /><circle cx="11" cy="7" r=".8" fill="currentColor" /><circle cx="15" cy="9" r=".8" fill="currentColor" /></>,
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
};

export function Icon({ name, className }: Props) {
  return <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
