import { resolveDisplay, resolveLineHeight, resolveMisc, resolvePadding, resolveTextAlign, resolveTextSize, resolveVerticalAlign, resolveWidth } from "../utilityClassRegistry";

describe("resolvePadding", () => {
  it("matches an existing scale tick without minting", () => {
    expect(resolvePadding("base", "pt", 24)).toEqual({
      className: "pt-24",
      cssRule: ".pt-24 { padding-top: 24px !important; }",
      isNew: false,
    });
  });

  it("uses the tier prefix", () => {
    expect(resolvePadding("sm", "pb", 16).className).toBe("sm-pb-16");
    expect(resolvePadding("xs", "pl", 8).className).toBe("xs-pl-8");
  });

  it("mints a new class when the value isn't on the tier's scale", () => {
    const resolved = resolvePadding("base", "pt", 6);
    expect(resolved.isNew).toBe(true);
    expect(resolved.className).toBe("pt-6");
    expect(resolved.cssRule).toBe(".pt-6 { padding-top: 6px !important; }");
  });

  it("px/py resolve to a two-property rule", () => {
    expect(resolvePadding("base", "px", 16).cssRule).toBe(".px-16 { padding-left: 16px; padding-right: 16px !important; }");
  });
});

describe("resolveWidth", () => {
  it("returns the full/half/third/two-thirds/auto classes at the base tier", () => {
    expect(resolveWidth("base", "full")?.className).toBe("w-full");
    expect(resolveWidth("base", "third")?.className).toBe("w-third");
  });

  it("omits third/two-thirds at sm/xs tiers (not defined in the reference file)", () => {
    expect(resolveWidth("sm", "third")).toBeUndefined();
    expect(resolveWidth("xs", "half")).toBeUndefined();
    expect(resolveWidth("sm", "half")?.className).toBe("sm-w-half");
  });
});

describe("resolveTextSize", () => {
  it("matches the base tier's named scale", () => {
    expect(resolveTextSize("base", 16)).toEqual({
      className: "text-base",
      cssRule: ".text-base { font-size: 16px !important; }",
      isNew: false,
    });
  });

  it("uses a DISTINCT scale at the xs tier, not the base scale under a prefix", () => {
    // base tier's "sm" step is 14px; xs tier's "sm" step is a different value (13px).
    expect(resolveTextSize("xs", 13).className).toBe("xs-text-sm");
    expect(resolveTextSize("xs", 14).isNew).toBe(true); // 14px isn't on the xs tier's own scale
  });

  it("mints a pxN class when no scale tick matches", () => {
    const resolved = resolveTextSize("base", 10);
    expect(resolved.isNew).toBe(true);
    expect(resolved.className).toBe("text-10px");
  });
});

describe("resolveLineHeight", () => {
  it("matches the named scale", () => {
    expect(resolveLineHeight("base", 1.5).className).toBe("leading-normal");
  });

  it("mints when unmatched", () => {
    const resolved = resolveLineHeight("base", 1.1);
    expect(resolved.isNew).toBe(true);
    expect(resolved.className).toBe("leading-1_1");
  });
});

describe("resolveTextAlign / resolveVerticalAlign", () => {
  it("is unavailable where the reference file doesn't define it", () => {
    expect(resolveTextAlign("xs", "right")).toBeUndefined(); // xs tier only has left/center
    expect(resolveVerticalAlign("xs", "middle")).toBeUndefined(); // xs tier only has top
    expect(resolveVerticalAlign("base", "bottom")?.className).toBe("align-bottom");
  });
});

describe("resolveDisplay", () => {
  it("matches the always-defined hidden/block pair at every tier", () => {
    expect(resolveDisplay("base", "hidden")).toEqual({ className: "hidden", cssRule: ".hidden { display: none !important; }", isNew: false });
    expect(resolveDisplay("sm", "block").isNew).toBe(false);
  });

  it("flags table/table-cell as new at sm/xs tiers (only defined at base)", () => {
    expect(resolveDisplay("sm", "table").isNew).toBe(true);
  });
});

describe("resolveMisc", () => {
  it("flags no-radius as new at the base tier (base already includes it unconditionally elsewhere) but not at sm/xs", () => {
    expect(resolveMisc("base", "noRadius").isNew).toBe(true);
    expect(resolveMisc("sm", "noRadius").isNew).toBe(false);
  });

  it("no-shadow is unavailable (new) at the xs tier", () => {
    expect(resolveMisc("xs", "noShadow").isNew).toBe(true);
    expect(resolveMisc("base", "noShadow").isNew).toBe(false);
  });
});
