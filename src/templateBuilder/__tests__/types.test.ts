import { toggleCornerRadiusLock } from "../types";

describe("toggleCornerRadiusLock", () => {
  it("unlocking (cornerRadii undefined) seeds all four corners with the current uniform value", () => {
    expect(toggleCornerRadiusLock(8, undefined)).toEqual({ cornerRadius: 8, cornerRadii: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 } });
  });

  it("unlocking with no scalar set yet defaults every corner to 0", () => {
    expect(toggleCornerRadiusLock(undefined, undefined)).toEqual({ cornerRadius: undefined, cornerRadii: { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 } });
  });

  it("re-locking (cornerRadii set) collapses to the top-left corner's value and clears cornerRadii", () => {
    expect(toggleCornerRadiusLock(8, { topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16 })).toEqual({ cornerRadius: 4, cornerRadii: undefined });
  });
});
