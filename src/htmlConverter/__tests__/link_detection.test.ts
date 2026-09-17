import { classifyColorBucket, isBlueish, isLinkColor, parseColor } from "../utils/colorUtils";

describe("Smart Link Detection", () => {
  describe("parseColor", () => {
    it("should parse 6-digit hex", () => {
      expect(parseColor("#0000FF")).toEqual({ r: 0, g: 0, b: 255 });
      expect(parseColor("#FFFFFF")).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("should parse 8-digit and 4-digit hex (alpha ignored)", () => {
      expect(parseColor("#0000FFCC")).toEqual({ r: 0, g: 0, b: 255 });
      expect(parseColor("#00FC")).toEqual({ r: 0, g: 0, b: 255 });
    });

    it("should parse 3-digit hex", () => {
      expect(parseColor("#00F")).toEqual({ r: 0, g: 0, b: 255 });
      expect(parseColor("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
    });

    it("should parse rgb strings", () => {
      expect(parseColor("rgb(0, 0, 255)")).toEqual({ r: 0, g: 0, b: 255 });
      expect(parseColor("rgb(10, 20, 30)")).toEqual({ r: 10, g: 20, b: 30 });
    });

    it("should parse rgb strings with spacing", () => {
      expect(parseColor("rgb( 0 ,  0,255 )")).toEqual({ r: 0, g: 0, b: 255 });
    });

    it("should parse rgba and ignore alpha", () => {
      expect(parseColor("rgba(0, 0, 255, 0.5)")).toEqual({ r: 0, g: 0, b: 255 });
    });

    it("should handle !important suffix", () => {
      expect(parseColor("rgb(0, 0, 255) !important")).toEqual({ r: 0, g: 0, b: 255 });
    });

    it("should reject out-of-range rgb values", () => {
      expect(parseColor("rgb(256, 0, 255)")).toBeNull();
      expect(parseColor("rgb(0, 999, 0)")).toBeNull();
    });

    it("should return null for invalid colors", () => {
      expect(parseColor("invalid")).toBeNull();
      expect(parseColor("#ZZTOP")).toBeNull();
    });
  });

  describe("isBlueish", () => {
    it("should identify standard links as blueish", () => {
      expect(isBlueish("#0000FF")).toBe(true); // Standard Blue
      expect(isBlueish("#0000EE")).toBe(true); // Web Link Blue
      expect(isBlueish("#1155CC")).toBe(true); // Google Docs Link
    });

    it("should identify light blues (Google Docs variants)", () => {
      expect(isBlueish("#CFE2F3")).toBe(true);
      expect(isBlueish("#9FC5E8")).toBe(true);
      expect(isBlueish("#3D85C6")).toBe(true);
    });

    it("should identify purples (visited links)", () => {
      expect(isBlueish("#551A8B")).toBe(true); // Standard Purple Visited
    });

    it("should REJECT non-link colors", () => {
      expect(isBlueish("#FF0000")).toBe(false); // Red
      expect(isBlueish("#00FF00")).toBe(false); // Green
      expect(isBlueish("#000000")).toBe(false); // Black
      expect(isBlueish("#FFFFFF")).toBe(false); // White
      expect(isBlueish("#808080")).toBe(false); // Gray
      expect(isBlueish("#FFFF00")).toBe(false); // Yellow
    });

    it("should handle rgb input", () => {
      expect(isBlueish("rgb(0, 0, 255)")).toBe(true);
      expect(isBlueish("rgb(255, 0, 0)")).toBe(false);
    });
  });

  describe("isLinkColor", () => {
    it("should use shared link detection logic", () => {
      expect(isLinkColor("#1155CC")).toBe(true);
      expect(isLinkColor("rgb(255, 0, 0)")).toBe(false);
    });

    it("should support !important without false negatives", () => {
      expect(isLinkColor("rgb(17, 85, 204) !important")).toBe(true);
    });
  });

  describe("classifyColorBucket", () => {
    it("identifies bright red and green", () => {
      expect(classifyColorBucket("#FF0000")).toBe("red");
      expect(classifyColorBucket("#00FF00")).toBe("green");
    });

    it("identifies muted/dark red and green", () => {
      expect(classifyColorBucket("#8B0000")).toBe("red"); // dark red
      expect(classifyColorBucket("#2F4F2F")).toBe("green"); // dark slate green
    });

    it("rejects grayscale and near-black/near-white", () => {
      expect(classifyColorBucket("#000000")).toBeNull();
      expect(classifyColorBucket("#FFFFFF")).toBeNull();
      expect(classifyColorBucket("#808080")).toBeNull();
      expect(classifyColorBucket("#1A1A1A")).toBeNull(); // GDocs near-black artifact
    });

    it("rejects blue/purple (handled separately as link colors)", () => {
      expect(classifyColorBucket("#1155CC")).toBeNull();
      expect(classifyColorBucket("#551A8B")).toBeNull();
    });

    it("rejects hues outside the red/green buckets", () => {
      expect(classifyColorBucket("#FFA500")).toBeNull(); // orange
      expect(classifyColorBucket("#FFFF00")).toBeNull(); // yellow
      expect(classifyColorBucket("#008080")).toBeNull(); // teal
    });

    it("rejects pastel tints even when hue is near a bucket center", () => {
      expect(classifyColorBucket("#FFC0CB")).toBeNull(); // pink — hue near red, but too light
    });

    it("returns null for unparseable colors", () => {
      expect(classifyColorBucket("invalid")).toBeNull();
    });
  });
});
