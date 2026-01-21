import { describe, it, expect } from "vitest";
import { normalizeUnit } from "../src/parser.js";

describe("Parser Utilities", () => {
  describe("normalizeUnit", () => {
    it("sollte Einheiten normalisieren", () => {
      expect(normalizeUnit("x")).toBe("Stk");
      expect(normalizeUnit("stück")).toBe("Stk");
      expect(normalizeUnit("stk.")).toBe("Stk");
      expect(normalizeUnit("Stk")).toBe("Stk");
      expect(normalizeUnit("meter")).toBe("m");
      expect(normalizeUnit("rolle(n)")).toBe("rolle");
      expect(normalizeUnit("kg")).toBe("kg");
      expect(normalizeUnit("l")).toBe("l");
    });

    it("sollte unbekannte Einheiten auf Stk mappen", () => {
      expect(normalizeUnit("unbekannt")).toBe("Stk");
      expect(normalizeUnit("")).toBe("Stk");
    });
  });
});

