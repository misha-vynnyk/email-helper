import { computeBoxStyle, formatLinearGradientCss, toReactStyle } from "../styling/boxStyle";
import { createDefaultRowBlock, createDefaultSectionBlock } from "../types";

describe("computeBoxStyle", () => {
  it("uses block.widthPx as ownWidthPx when set", () => {
    const block = { ...createDefaultSectionBlock("s1", null), widthPx: 552 };
    expect(computeBoxStyle(block, 300).ownWidthPx).toBe(552);
  });

  it("falls back to availableWidthPx as ownWidthPx when block.widthPx is undefined", () => {
    const block = { ...createDefaultSectionBlock("s2", "parent"), widthPx: undefined };
    expect(computeBoxStyle(block, 300).ownWidthPx).toBe(300);
  });

  it("clamps childrenAvailableWidthPx to 0 when padding exceeds the section's own width", () => {
    const block = { ...createDefaultSectionBlock("s3", null), widthPx: 552, padding: { top: 0, right: 400, bottom: 0, left: 400 } };
    expect(computeBoxStyle(block, 552).childrenAvailableWidthPx).toBe(0);
  });

  it("passes through fill/border/cornerRadius/shadow as undefined when unset on the block", () => {
    const block = createDefaultSectionBlock("s4", null);
    const computed = computeBoxStyle(block, 552);
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
    const computed = computeBoxStyle(block, 552);
    expect(computed.fill).toBe("#fff9e9");
    expect(computed.border).toEqual({ widthPx: 1, color: "#365373" });
    expect(computed.cornerRadius).toBe(8);
    expect(computed.shadow).toEqual({ xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" });
  });

  it("prefers cornerRadii (unlocked per-corner) over the scalar cornerRadius when both are set", () => {
    const block = { ...createDefaultSectionBlock("s7", null), cornerRadius: 8, cornerRadii: { topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16 } };
    expect(computeBoxStyle(block, 552).cornerRadius).toEqual({ topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16 });
  });

  // Generalized off SectionBlock in canva-plan-v2.md Stage 2 once RowBlock gained the same
  // fill/border/cornerRadius/cornerRadii/shadow fields — these prove a RowBlock computes
  // identically to a SectionBlock with the same field values, not just that the types line up.
  it("computes the same box style from a RowBlock as from a SectionBlock given the same field values", () => {
    const row = {
      ...createDefaultRowBlock("r1", null),
      fill: "#fff9e9",
      border: { widthPx: 1, color: "#365373" },
      cornerRadius: 8,
      shadow: { xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" },
    };
    const computed = computeBoxStyle(row, 552);
    expect(computed.fill).toBe("#fff9e9");
    expect(computed.border).toEqual({ widthPx: 1, color: "#365373" });
    expect(computed.cornerRadius).toBe(8);
    expect(computed.shadow).toEqual({ xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" });
  });

  it("falls back to availableWidthPx for a nested RowBlock the same way it does for a nested SectionBlock", () => {
    const row = { ...createDefaultRowBlock("r2", "parent"), widthPx: undefined };
    expect(computeBoxStyle(row, 300).ownWidthPx).toBe(300);
  });

  it("passes a linearGradient fill through unchanged, same as a solid fill", () => {
    const gradient = { kind: "linearGradient" as const, angleDeg: 180, stops: [{ color: "#DADAD8", position: 0 }, { color: "#F9F7F3", position: 0.0744 }] };
    const block = { ...createDefaultSectionBlock("s8", null), fill: gradient };
    expect(computeBoxStyle(block, 552).fill).toEqual(gradient);
  });
});

describe("toReactStyle", () => {
  const baseComputed = computeBoxStyle(createDefaultSectionBlock("s6", null), 552);

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

  it("formats an unlocked per-corner cornerRadius as the CSS 4-value shorthand (top-left top-right bottom-right bottom-left)", () => {
    const computed = { ...baseComputed, cornerRadius: { topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16 } };
    expect(toReactStyle(computed, { widthMode: "fixed" }).borderRadius).toBe("4px 8px 12px 16px");
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

  it("maps a linearGradient fill to the background shorthand, leaving backgroundColor undefined", () => {
    const gradient = { kind: "linearGradient" as const, angleDeg: 180, stops: [{ color: "#DADAD8", position: 0 }, { color: "#F9F7F3", position: 0.0744 }] };
    const computed = { ...baseComputed, fill: gradient };
    const style = toReactStyle(computed, { widthMode: "fixed" });
    expect(style.background).toBe("linear-gradient(180deg, #DADAD8 0%, #F9F7F3 7.44%)");
    expect(style.backgroundColor).toBeUndefined();
  });

  it("maps a solid string fill to backgroundColor, leaving background undefined (unchanged solid-fill behavior)", () => {
    const computed = { ...baseComputed, fill: "#fff9e9" };
    const style = toReactStyle(computed, { widthMode: "fixed" });
    expect(style.backgroundColor).toBe("#fff9e9");
    expect(style.background).toBeUndefined();
  });
});

describe("formatLinearGradientCss", () => {
  it("formats angle and stops as a CSS linear-gradient() string", () => {
    const gradient = { kind: "linearGradient" as const, angleDeg: 180, stops: [{ color: "#DADAD8", position: 0 }, { color: "#F9F7F3", position: 0.0744 }] };
    expect(formatLinearGradientCss(gradient)).toBe("linear-gradient(180deg, #DADAD8 0%, #F9F7F3 7.44%)");
  });

  it("rounds a position with floating-point noise to a clean percentage", () => {
    const gradient = { kind: "linearGradient" as const, angleDeg: 90, stops: [{ color: "#000", position: 0.29 }, { color: "#fff", position: 1 }] };
    expect(formatLinearGradientCss(gradient)).toBe("linear-gradient(90deg, #000 29%, #fff 100%)");
  });
});
