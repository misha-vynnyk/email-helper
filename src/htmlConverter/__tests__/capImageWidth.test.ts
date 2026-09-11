import { capImageWidth } from "../utils/imageUtils";

describe("capImageWidth", () => {
  it("returns the container width unchanged when the real width is unknown", () => {
    expect(capImageWidth(600, undefined)).toBe(600);
  });

  it("returns the container width unchanged when the real width is 0 (falsy)", () => {
    expect(capImageWidth(600, 0)).toBe(600);
  });

  it("returns the container width unchanged when the real width is >= the container width", () => {
    expect(capImageWidth(600, 600)).toBe(600);
    expect(capImageWidth(600, 900)).toBe(600);
  });

  it("caps down to the real width, floored to the nearest 10px step", () => {
    expect(capImageWidth(600, 234)).toBe(230);
    expect(capImageWidth(600, 240)).toBe(240);
  });

  it("never caps below a 10px floor even for a tiny real width", () => {
    expect(capImageWidth(600, 3)).toBe(10);
  });
});
