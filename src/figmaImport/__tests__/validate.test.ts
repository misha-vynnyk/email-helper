import { validateDesignPair } from "../validate";

const validDivider = {
  id: "divider-1",
  name: "Divider",
  type: "divider",
  color: "#FCBF24",
  thicknessPx: 1,
};

function json(nodes: unknown[]): string {
  return JSON.stringify(nodes);
}

describe("validateDesignPair", () => {
  it("passes for a valid matching pair", () => {
    const result = validateDesignPair(json([validDivider]), json([validDivider]));

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.desktopNodes).toHaveLength(1);
    expect(result.mobileNodes).toHaveLength(1);
  });

  it("fails with a specific message when a required field is missing", () => {
    const brokenFrame = {
      id: "frame-1",
      type: "frame",
      direction: "column",
      children: [],
      // `padding` is required on FrameNode and intentionally omitted here
    };

    const result = validateDesignPair(json([brokenFrame]), json([brokenFrame]));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        file: "desktop",
        path: "0.padding",
        message: expect.stringContaining("Required"),
      })
    );
  });

  it("fails with a specific message when a field has the wrong type", () => {
    const wrongType = {
      ...validDivider,
      thicknessPx: "1px", // should be a number
    };

    const result = validateDesignPair(json([wrongType]), json([wrongType]));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        file: "desktop",
        path: "0.thicknessPx",
        message: expect.stringContaining("number"),
      })
    );
  });

  it("fails with a specific message when a field name is misspelled (unknown key)", () => {
    const typoField = {
      id: "divider-2",
      name: "Divider",
      type: "divider",
      colr: "#FCBF24", // typo of `color`
    };

    const result = validateDesignPair(json([typoField]), json([typoField]));

    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.file === "desktop" && (e.message.includes("color") || e.message.includes("colr"))
      )
    ).toBe(true);
  });

  it("fails when an id exists only in one file without a matching visibility flag", () => {
    const desktopOnlyNode = { ...validDivider, id: "divider-desktop-only" };

    const result = validateDesignPair(json([desktopOnlyNode]), json([]));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        file: "desktop",
        path: 'id="divider-desktop-only"',
        message: expect.stringContaining("desktopOnly"),
      })
    );
  });

  it("passes when a one-file-only id is explicitly marked with the matching visibility flag", () => {
    const mobileOnlyNode = { ...validDivider, id: "divider-mobile-only", visibility: "mobileOnly" };

    const result = validateDesignPair(json([]), json([mobileOnlyNode]));

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails with a JSON syntax error message when a file isn't valid JSON", () => {
    const result = validateDesignPair("{not valid json", json([validDivider]));

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        file: "desktop",
        message: expect.stringContaining("Invalid JSON"),
      })
    );
  });
});
