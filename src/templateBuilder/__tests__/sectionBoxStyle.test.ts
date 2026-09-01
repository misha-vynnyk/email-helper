import { computeSectionBox, toReactStyle } from "../styling/sectionBoxStyle";
import { createDefaultSectionBlock } from "../types";

describe("computeSectionBox", () => {
  it("uses block.widthPx as ownWidthPx when set", () => {
    const block = { ...createDefaultSectionBlock("s1", null), widthPx: 552 };
    expect(computeSectionBox(block, 300).ownWidthPx).toBe(552);
  });

  it("falls back to availableWidthPx as ownWidthPx when block.widthPx is undefined", () => {
    const block = { ...createDefaultSectionBlock("s2", "parent"), widthPx: undefined };
    expect(computeSectionBox(block, 300).ownWidthPx).toBe(300);
  });

  it("clamps childrenAvailableWidthPx to 0 when padding exceeds the section's own width", () => {
    const block = { ...createDefaultSectionBlock("s3", null), widthPx: 552, padding: { top: 0, right: 400, bottom: 0, left: 400 } };
    expect(computeSectionBox(block, 552).childrenAvailableWidthPx).toBe(0);
  });

  it("passes through fill/border/cornerRadius/shadow as undefined when unset on the block", () => {
    const block = createDefaultSectionBlock("s4", null);
    const computed = computeSectionBox(block, 552);
    expect(computed.fill).toBeUndefined();
    expect(computed.border).toBeUndefined();
    expect(computed.cornerRadius).toBeUndefined();
    expect(computed.shadow).toBeUndefined();
  });

  it("passes through fill/border/cornerRadius/shadow when set on the block", () => {
    const block = {
      ...createDefaultSectionBlock("s5", null),
      fill: "#fff9e9",
      border: { widthPx: 1, color: "#365373" },
      cornerRadius: 8,
      shadow: { xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" },
    };
    const computed = computeSectionBox(block, 552);
    expect(computed.fill).toBe("#fff9e9");
    expect(computed.border).toEqual({ widthPx: 1, color: "#365373" });
    expect(computed.cornerRadius).toBe(8);
    expect(computed.shadow).toEqual({ xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" });
  });
});

describe("toReactStyle", () => {
  const baseComputed = computeSectionBox(createDefaultSectionBlock("s6", null), 552);

  it("maps padding fields straight through", () => {
    const style = toReactStyle(baseComputed, { widthMode: "fixed" });
    expect(style.paddingTop).toBe(baseComputed.paddingTop);
    expect(style.paddingRight).toBe(baseComputed.paddingRight);
    expect(style.paddingBottom).toBe(baseComputed.paddingBottom);
    expect(style.paddingLeft).toBe(baseComputed.paddingLeft);
  });

  it("produces undefined (not empty string or 0) for unset fill/border/cornerRadius/shadow", () => {
    const style = toReactStyle(baseComputed, { widthMode: "fixed" });
    expect(style.backgroundColor).toBeUndefined();
    expect(style.border).toBeUndefined();
    expect(style.borderRadius).toBeUndefined();
    expect(style.boxShadow).toBeUndefined();
  });

  it("formats border as a CSS border shorthand", () => {
    const computed = { ...baseComputed, border: { widthPx: 1, color: "#365373" } };
    expect(toReactStyle(computed, { widthMode: "fixed" }).border).toBe("1px solid #365373");
  });

  it("formats shadow as a CSS boxShadow shorthand", () => {
    const computed = { ...baseComputed, shadow: { xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" } };
    expect(toReactStyle(computed, { widthMode: "fixed" }).boxShadow).toBe("0px 2px 4px rgba(0,0,0,0.1)");
  });

  it("maps fill straight through to backgroundColor", () => {
    const computed = { ...baseComputed, fill: "#fff9e9" };
    expect(toReactStyle(computed, { widthMode: "fixed" }).backgroundColor).toBe("#fff9e9");
  });

  it("maps cornerRadius straight through to borderRadius", () => {
    const computed = { ...baseComputed, cornerRadius: 8 };
    expect(toReactStyle(computed, { widthMode: "fixed" }).borderRadius).toBe(8);
  });

  it("uses computed.ownWidthPx as a numeric width when widthMode is fixed", () => {
    const computed = { ...baseComputed, ownWidthPx: 552 };
    expect(toReactStyle(computed, { widthMode: "fixed" }).width).toBe(552);
  });

  it("uses 100% as width when widthMode is fill, regardless of ownWidthPx", () => {
    const computed = { ...baseComputed, ownWidthPx: 300 };
    expect(toReactStyle(computed, { widthMode: "fill" }).width).toBe("100%");
  });

  it("centers with margin: 0 auto when widthMode is fixed", () => {
    const style = toReactStyle(baseComputed, { widthMode: "fixed" });
    expect(style.marginLeft).toBe("auto");
    expect(style.marginRight).toBe("auto");
  });

  it("leaves margin unset when widthMode is fill (already 100% wide, centering is moot)", () => {
    const style = toReactStyle(baseComputed, { widthMode: "fill" });
    expect(style.marginLeft).toBeUndefined();
    expect(style.marginRight).toBeUndefined();
  });
});
