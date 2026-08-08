import type { OrderItem, OrderItemInput } from "./types/menu";

const optionsKey = (options: readonly string[] | undefined) => [...(options ?? [])].sort().join("|");

export const orderItemKey = (item: Pick<OrderItemInput, "kategorie" | "id" | "selectedSize" | "selectedOptions">) => `${item.kategorie}:${item.id}:${item.selectedSize ?? ""}:${optionsKey(item.selectedOptions)}`;

export const sameOrderItem = (left: OrderItemInput, right: OrderItemInput) => orderItemKey(left) === orderItemKey(right);

export const addToOrder = (order: readonly OrderItem[], item: OrderItemInput): OrderItem[] => {
  const index = order.findIndex((entry) => sameOrderItem(entry, item));
  return index === -1 ? [...order, { ...item, pocet: 1 }] : order.map((entry, entryIndex) => entryIndex === index ? { ...entry, pocet: entry.pocet + 1 } : entry);
};
