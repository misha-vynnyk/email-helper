import { buildPaddingStyle } from "../render/paddingStyle";

describe("buildPaddingStyle", () => {
  it("renders all four sides when none are zero", () => {
    expect(buildPaddingStyle({ top: 32, right: 20, bottom: 24, left: 20 })).toBe("padding-right: 20px; padding-left: 20px; padding-top: 32px; padding-bottom: 24px;");
  });

  it("omits a single zero side, keeping the other three", () => {
    expect(buildPaddingStyle({ top: 32, right: 0, bottom: 24, left: 20 })).toBe("padding-left: 20px; padding-top: 32px; padding-bottom: 24px;");
  });

  it("omits two zero sides, keeping the other two", () => {
    expect(buildPaddingStyle({ top: 0, right: 400, bottom: 0, left: 400 })).toBe("padding-right: 400px; padding-left: 400px;");
  });

  it("collapses to a single 'padding: 0;' shorthand when all four sides are zero, instead of omitting padding entirely", () => {
    expect(buildPaddingStyle({ top: 0, right: 0, bottom: 0, left: 0 })).toBe("padding: 0;");
  });

  it("keeps a single non-zero side alongside three omitted zero sides", () => {
    expect(buildPaddingStyle({ top: 0, right: 0, bottom: 12, left: 0 })).toBe("padding-bottom: 12px;");
  });
});
