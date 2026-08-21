import { describe, expect, it } from "vitest";
import { requiresPin } from "./pinProtection";

describe("PIN protection", () => {
  it("protects only the configured admin views when enabled", () => {
    expect(requiresPin(true, "settings")).toBe(true);
    expect(requiresPin(true, "menu")).toBe(true);
    expect(requiresPin(true, "overview")).toBe(true);
    expect(requiresPin(true, "backup")).toBe(true);
    expect(requiresPin(true, "history")).toBe(false);
  });

  it("bypasses every protected view when disabled", () => {
    expect(requiresPin(false, "settings")).toBe(false);
    expect(requiresPin(false, "menu")).toBe(false);
    expect(requiresPin(false, "overview")).toBe(false);
    expect(requiresPin(false, "backup")).toBe(false);
  });
});
