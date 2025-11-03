import { describe, it, expect, beforeEach } from "vitest";
import { IdempotencyBus } from "../src/bus.js";

describe("IdempotencyBus", () => {
  let bus: IdempotencyBus;

  beforeEach(() => {
    bus = new IdempotencyBus(1000); // 1s TTL für Tests
  });

  it("sollte neue Request-IDs als nicht-dupliziert erkennen", () => {
    expect(bus.isDuplicate("test-1")).toBe(false);
  });

  it("sollte verarbeitete Request-IDs als dupliziert erkennen", () => {
    bus.markProcessed("test-1");
    expect(bus.isDuplicate("test-1")).toBe(true);
  });

  it("sollte abgelaufene Einträge löschen", async () => {
    bus.markProcessed("test-1");
    expect(bus.isDuplicate("test-1")).toBe(true);

    // Warte bis TTL abläuft
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(bus.isDuplicate("test-1")).toBe(false);
  });

  it("sollte Cleanup durchführen", () => {
    bus.markProcessed("test-1");
    bus.markProcessed("test-2");
    expect(bus.size()).toBe(2);

    bus.clear();
    expect(bus.size()).toBe(0);
  });
});

