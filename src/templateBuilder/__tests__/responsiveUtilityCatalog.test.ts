import { RESPONSIVE_BREAKPOINT_PX, RESPONSIVE_TIER_ORDER, UTILITY_CLASS_CATALOG } from "../responsiveUtilityCatalog";

describe("responsiveUtilityCatalog", () => {
  it("has no duplicate class names", () => {
    const names = UTILITY_CLASS_CATALOG.map((entry) => entry.className);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every entry has a non-empty group and a declaration ending in !important", () => {
    for (const entry of UTILITY_CLASS_CATALOG) {
      expect(entry.group.length).toBeGreaterThan(0);
      expect(entry.declaration).toMatch(/!important;\s*$/);
    }
  });

  it("every entry's tier is one of the three fixed breakpoints", () => {
    for (const entry of UTILITY_CLASS_CATALOG) {
      expect(RESPONSIVE_TIER_ORDER).toContain(entry.tier);
    }
  });

  it("orders tiers base -> sm -> xs, narrowest last (source order the cascade depends on)", () => {
    expect(RESPONSIVE_TIER_ORDER).toEqual(["base", "sm", "xs"]);
    expect(RESPONSIVE_BREAKPOINT_PX.base).toBeGreaterThan(RESPONSIVE_BREAKPOINT_PX.sm);
    expect(RESPONSIVE_BREAKPOINT_PX.sm).toBeGreaterThan(RESPONSIVE_BREAKPOINT_PX.xs);
  });

  it("prefixes sm/xs tier class names but not base", () => {
    const byName = new Map(UTILITY_CLASS_CATALOG.map((e) => [e.className, e]));
    expect(byName.get("pt-8")?.tier).toBe("base");
    expect(byName.get("sm-hidden")?.tier).toBe("sm");
    expect(byName.get("sm-hidden")?.declaration).toBe("display: none !important;");
    expect(byName.get("xs-text-center")?.tier).toBe("xs");
  });

  it("carries forward the three previously-dead shell classes (footer-button/spacer-hide/no-radius) as ordinary opt-in base entries", () => {
    const byName = new Map(UTILITY_CLASS_CATALOG.map((e) => [e.className, e]));
    expect(byName.get("footer-button")?.tier).toBe("base");
    expect(byName.get("spacer-hide")?.declaration).toBe("display: none !important;");
    expect(byName.get("no-radius")?.declaration).toBe("border-radius: 0 !important;");
  });
});
