import { isDarkBg, canonicalizeText, canonicalizeBg, isBgRedundant } from "../ir/color";

describe("ir/color", () => {
  // ── isDarkBg ───────────────────────────────────────────────────────────────

  describe("isDarkBg", () => {
    it("returns true for black", () => {
      expect(isDarkBg("#000000")).toBe(true);
    });

    it("returns true for dark navy", () => {
      expect(isDarkBg("#0a1628")).toBe(true);
    });

    it("returns false for white", () => {
      expect(isDarkBg("#ffffff")).toBe(false);
    });

    it("returns false for light gray", () => {
      expect(isDarkBg("#f5f5f5")).toBe(false);
    });

    it("returns false for transparent", () => {
      expect(isDarkBg("transparent")).toBe(false);
    });

    it("handles 3-char hex", () => {
      expect(isDarkBg("#000")).toBe(true);
      expect(isDarkBg("#fff")).toBe(false);
    });

    it("handles rgb()", () => {
      expect(isDarkBg("rgb(0, 0, 0)")).toBe(true);
      expect(isDarkBg("rgb(255, 255, 255)")).toBe(false);
    });

    it("handles rgba() — ignores alpha", () => {
      expect(isDarkBg("rgba(0, 0, 0, 0.5)")).toBe(true);
      expect(isDarkBg("rgba(255, 255, 255, 0.1)")).toBe(false);
    });

    it("returns false for invalid input", () => {
      expect(isDarkBg("not-a-color")).toBe(false);
    });
  });

  // ── canonicalizeText ───────────────────────────────────────────────────────

  describe("canonicalizeText", () => {
    it("snaps near-black text to #000000 on white bg", () => {
      expect(canonicalizeText("#0a0a0a", "#ffffff")).toBe("#000000");
    });

    it("snaps near-white text to #ffffff on dark bg", () => {
      expect(canonicalizeText("#f8f8f8", "#000000")).toBe("#ffffff");
    });

    it("does NOT snap near-black on dark bg (would be invisible)", () => {
      const result = canonicalizeText("#0a0a0a", "#000000");
      expect(result).not.toBe("#ffffff");
    });

    it("preserves vivid color", () => {
      expect(canonicalizeText("#cc0000", "#ffffff")).toBe("#cc0000");
    });

    it("returns null for transparent", () => {
      expect(canonicalizeText("transparent", "#ffffff")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(canonicalizeText("", "#ffffff")).toBeNull();
    });

    it("handles rgba() input", () => {
      const result = canonicalizeText("rgba(10, 10, 10, 1)", "#ffffff");
      expect(result).toBe("#000000");
    });
  });

  // ── canonicalizeBg ────────────────────────────────────────────────────────

  describe("canonicalizeBg", () => {
    it("snaps near-black bg to #000000", () => {
      expect(canonicalizeBg("#0a0a0a")).toBe("#000000");
    });

    it("preserves light accent color", () => {
      expect(canonicalizeBg("#fff7ed")).toBe("#fff7ed");
    });

    it("preserves white (no snap)", () => {
      expect(canonicalizeBg("#ffffff")).toBe("#ffffff");
    });

    it("returns null for transparent", () => {
      expect(canonicalizeBg("transparent")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(canonicalizeBg("")).toBeNull();
    });
  });

  // ── isBgRedundant ─────────────────────────────────────────────────────────

  describe("isBgRedundant", () => {
    it("returns true for identical colors", () => {
      expect(isBgRedundant("#ffffff", "#ffffff")).toBe(true);
    });

    it("returns true for near-identical colors (within threshold)", () => {
      expect(isBgRedundant("#fefefe", "#ffffff")).toBe(true);
    });

    it("returns false for clearly different colors", () => {
      expect(isBgRedundant("#cc0000", "#ffffff")).toBe(false);
    });

    it("returns false for transparent input", () => {
      expect(isBgRedundant("transparent", "#ffffff")).toBe(false);
    });
  });
});
