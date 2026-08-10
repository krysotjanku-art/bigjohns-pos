import { describe, expect, it } from "vitest";
import { ORDER_COUNTER_KEY, RECEIPT_COUNTER_KEY, createBackup, parseBackup, restoreBackup } from "./backup";
import { ORDER_HISTORY_KEY } from "./orderHistory";
import { PIN_KEY } from "./adminPin";
import { SUSPENDED_ORDERS_KEY } from "./suspendedOrders";

const storage = (initial: Record<string, string> = {}) => { const values = new Map(Object.entries(initial)); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) }; };
const savedHistory = JSON.stringify([{ receiptNumber: 154, orderNumber: 23, cancelledAt: "2026-08-08T19:00:00.000Z", subtotal: 850, total: 750, discount: { type: "fixed", amount: 100 } }]);

describe("POS backup", () => {
  it("exports all persistent POS data including cancelled orders and counters", () => {
    const local = storage({ [ORDER_HISTORY_KEY]: savedHistory, [RECEIPT_COUNTER_KEY]: "154", [ORDER_COUNTER_KEY]: JSON.stringify({ date: "2026-08-08", value: 23 }),[PIN_KEY]:"2468" });
    const backup = createBackup(local, new Date("2026-08-08T20:00:00.000Z"));
    expect(backup.data).toMatchObject({ [ORDER_HISTORY_KEY]: savedHistory, [RECEIPT_COUNTER_KEY]: "154", [ORDER_COUNTER_KEY]: JSON.stringify({ date: "2026-08-08", value: 23 }),[PIN_KEY]:"2468" });
  });

  it("restores an exported backup exactly", () => {
    const source = storage({ [ORDER_HISTORY_KEY]: savedHistory, [RECEIPT_COUNTER_KEY]: "154", [ORDER_COUNTER_KEY]: JSON.stringify({ date: "2026-08-08", value: 23 }) });
    const target = storage({ [RECEIPT_COUNTER_KEY]: "999" });
    const backup = createBackup(source);
    restoreBackup(target, backup);
    expect(createBackup(target).data).toEqual(backup.data);
  });

  it("rejects invalid backups without changing existing data", () => {
    const local = storage({ [RECEIPT_COUNTER_KEY]: "154" });
    const before = createBackup(local).data;
    expect(parseBackup('{"version":1,"data":{}}')).toBeNull();
    expect(createBackup(local).data).toEqual(before);
  });

  it("preserves receipt and daily order counters and cancelled orders", () => {
    const local = storage({ [ORDER_HISTORY_KEY]: savedHistory, [RECEIPT_COUNTER_KEY]: "154", [ORDER_COUNTER_KEY]: JSON.stringify({ date: "2026-08-08", value: 23 }) });
    const parsed = parseBackup(JSON.stringify(createBackup(local)));
    expect(parsed?.data[RECEIPT_COUNTER_KEY]).toBe("154");
    expect(parsed?.data[ORDER_COUNTER_KEY]).toBe(JSON.stringify({ date: "2026-08-08", value: 23 }));
    expect(parsed?.data[ORDER_HISTORY_KEY]).toContain("cancelledAt"); expect(parsed?.data[ORDER_HISTORY_KEY]).toContain('"discount"');
  });

  it("includes suspended unpaid orders in backup and restore", () => {
    const suspended = JSON.stringify([{ id: "parked-1", createdAt: "2026-08-08T18:00:00.000Z", items: [], subtotal: 100, total: 90, discount: { type: "percentage", percentage: 10, amount: 10 } }]);
    const source = storage({ [SUSPENDED_ORDERS_KEY]: suspended });
    const target = storage();
    restoreBackup(target, createBackup(source));
    expect(createBackup(target).data[SUSPENDED_ORDERS_KEY]).toBe(suspended);
  });
});
