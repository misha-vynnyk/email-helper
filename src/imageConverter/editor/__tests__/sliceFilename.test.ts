import { withSliceSuffix } from "../sliceFilename";

describe("withSliceSuffix", () => {
  it("inserts the suffix before the extension", () => {
    expect(withSliceSuffix("photo.png", 1)).toBe("photo-slice-1.png");
  });

  it("handles multi-dot filenames by splitting at the last dot", () => {
    expect(withSliceSuffix("my.photo.v2.png", 3)).toBe("my.photo.v2-slice-3.png");
  });

  it("appends the suffix with no extension when the name has none", () => {
    expect(withSliceSuffix("photo", 2)).toBe("photo-slice-2");
  });

  it("treats a leading dot (dotfile, no real extension) as having no extension", () => {
    expect(withSliceSuffix(".gitignore", 1)).toBe(".gitignore-slice-1");
  });
});
