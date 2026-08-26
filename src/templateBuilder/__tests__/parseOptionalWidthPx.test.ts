import { parseOptionalWidthPx } from "../components/parseOptionalWidthPx";

describe("parseOptionalWidthPx", () => {
  it("parses a normal numeric string", () => {
    expect(parseOptionalWidthPx("552")).toBe(552);
  });

  it("treats an empty string as undefined (auto/fill)", () => {
    expect(parseOptionalWidthPx("")).toBeUndefined();
  });

  it("does NOT treat the literal value 0 as undefined — the falsy-zero bug this guards against", () => {
    expect(parseOptionalWidthPx("0")).toBe(0);
  });

  it("treats a non-numeric string as undefined instead of NaN", () => {
    expect(parseOptionalWidthPx("abc")).toBeUndefined();
  });
});
