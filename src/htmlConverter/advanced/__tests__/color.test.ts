import { isDarkBg, canonicalizeText, canonicalizeBg, isBgRedundant } from "../ir/color";
import { tokens } from "../config/tokens";

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

// ── parseHex edge cases (tested via public functions) ─────────────────────────

describe("ir/color — parseHex edge cases", () => {
  // 3-char hex (lowercase)
  it("isDarkBg accepts 3-char lowercase hex", () => {
    expect(isDarkBg("#000")).toBe(true);
    expect(isDarkBg("#fff")).toBe(false);
  });

  // Uppercase hex — parseHex lowercases input before matching
  it("isDarkBg accepts uppercase 6-char hex", () => {
    expect(isDarkBg("#000000")).toBe(true);
    expect(isDarkBg("#FFFFFF")).toBe(false);
  });

  it("isDarkBg accepts mixed-case hex", () => {
    expect(isDarkBg("#0A1628")).toBe(true);
    expect(isDarkBg("#F5F5F5")).toBe(false);
  });

  // Invalid hex → returns false (not a dark bg)
  it("isDarkBg returns false for invalid hex #xyz", () => {
    expect(isDarkBg("#xyz")).toBe(false);
  });

  it("isDarkBg returns false for 4-char hex (not a valid format)", () => {
    expect(isDarkBg("#1234")).toBe(false);
  });

  // rgb() with spaces around values
  it("isDarkBg handles rgb() with spaces around values", () => {
    expect(isDarkBg("rgb( 0 , 0 , 0 )")).toBe(true);
    expect(isDarkBg("rgb( 255 , 255 , 255 )")).toBe(false);
  });

  // rgba() — alpha channel is ignored entirely (parseHex extracts only rgb channels)
  it("isDarkBg ignores alpha — rgba(0,0,0,0.0) is treated as rgb(0,0,0) = dark", () => {
    // Fully-transparent black is still treated as dark because alpha is discarded
    expect(isDarkBg("rgba(0, 0, 0, 0.0)")).toBe(true);
    expect(isDarkBg("rgba(255, 255, 255, 1.0)")).toBe(false);
  });

  // canonicalizeText with invalid color string
  it("canonicalizeText returns null for invalid color string", () => {
    expect(canonicalizeText("not-a-color", "#ffffff")).toBeNull();
  });

  it("canonicalizeText returns null for hex with invalid chars", () => {
    expect(canonicalizeText("#zzzzzz", "#ffffff")).toBeNull();
  });

  // canonicalizeBg with invalid string
  it("canonicalizeBg returns null for invalid color string", () => {
    expect(canonicalizeBg("not-a-color")).toBeNull();
  });

  // isBgRedundant with two transparents
  it("isBgRedundant returns false when both inputs are transparent", () => {
    expect(isBgRedundant("transparent", "transparent")).toBe(false);
  });
});

// ── canonicalizeText — vivid colors preserved even on dark bg ─────────────────

describe("ir/color — canonicalizeText vivid color preservation", () => {
  it("vivid red is preserved on white bg (not snapped to black)", () => {
    // #cc0000 is not neutral — color channel spread is large
    expect(canonicalizeText("#cc0000", "#ffffff")).toBe("#cc0000");
  });

  it("vivid blue is preserved on dark bg (not snapped to white)", () => {
    // #0055ff is not a near-neutral on inverted — not snapped to white
    const result = canonicalizeText("#0055ff", "#000000");
    expect(result).not.toBe("#ffffff");
    expect(result).toBe("#0055ff");
  });

  it("near-black text (#111111) on white bg snaps to #000000", () => {
    // dist([17,17,17]) ≈ 29.4 which is <= blackSnap (48) — should snap
    expect(canonicalizeText("#111111", "#ffffff")).toBe("#000000");
  });

  it("near-white text (#eeeeee) on dark bg snaps to #ffffff", () => {
    // dist([255-238, ...]) = dist([17,17,17]) ≈ 29.4 <= whiteSnap (48)
    expect(canonicalizeText("#eeeeee", "#000000")).toBe("#ffffff");
  });
});

// ── isDarkBg — luminance boundary ─────────────────────────────────────────────

describe("ir/color — isDarkBg luminance boundary", () => {
  it("#808080 (rgb 128,128,128) is considered light — luminance ≈ 0.502 ≥ darkLuma 0.5", () => {
    // (0.299+0.587+0.114)*128/255 ≈ 0.502 — just above 0.5 threshold → not dark
    expect(isDarkBg("#808080")).toBe(false);
  });

  it("dark green (#006400) is dark", () => {
    // luminance = 0.299*0 + 0.587*100/255 + 0.114*0 ≈ 0.23
    expect(isDarkBg("#006400")).toBe(true);
  });

  it("yellow (#ffff00) is light", () => {
    expect(isDarkBg("#ffff00")).toBe(false);
  });

  it("medium blue (#0000cd) is dark", () => {
    // luminance = 0.114 * 205/255 ≈ 0.092
    expect(isDarkBg("#0000cd")).toBe(true);
  });

  it("default tok.color.rootBackground (#ffffff) is light", () => {
    expect(isDarkBg(tokens.color.rootBackground)).toBe(false);
  });
});
