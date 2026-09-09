import { buildBgcolorAttr, buildContainerExtraStyleParts } from "../render/containerStyleParts";
import { computeBoxStyle } from "../styling/boxStyle";
import { createDefaultSectionBlock } from "../types";

describe("buildContainerExtraStyleParts", () => {
  it("returns an empty array when nothing is set", () => {
    const computed = computeBoxStyle(createDefaultSectionBlock("s1", null), 552);
    expect(buildContainerExtraStyleParts(computed)).toEqual([]);
  });

  it("builds parts in a fixed order: fill, border, cornerRadius, shadow, border-collapse", () => {
    const block = {
      ...createDefaultSectionBlock("s2", null),
      fill: "#fff9e9",
      border: { widthPx: 1, color: "#365373" },
      cornerRadius: 8,
      shadow: { xPx: 0, yPx: 2, blurPx: 4, color: "rgba(0,0,0,0.1)" },
    };
    const computed = computeBoxStyle(block, 552);
    expect(buildContainerExtraStyleParts(computed)).toEqual([
      "background-color: #fff9e9",
      "border: 1px solid #365373",
      "border-radius: 8px",
      "box-shadow: 0px 2px 4px rgba(0,0,0,0.1)",
      "border-collapse: separate",
      "border-spacing: 0",
    ]);
  });

  it("formats an unlocked per-corner cornerRadii as the CSS 4-value shorthand", () => {
    const block = { ...createDefaultSectionBlock("s3", null), cornerRadii: { topLeft: 4, topRight: 8, bottomRight: 12, bottomLeft: 16 } };
    const computed = computeBoxStyle(block, 552);
    expect(buildContainerExtraStyleParts(computed)).toContain("border-radius: 4px 8px 12px 16px");
  });

  it("adds border-collapse only when a border or corner radius is actually set", () => {
    const withFillOnly = computeBoxStyle({ ...createDefaultSectionBlock("s4", null), fill: "#fff" }, 552);
    expect(buildContainerExtraStyleParts(withFillOnly)).not.toContain("border-collapse: separate");
  });

  it("renders a linearGradient fill as a background: linear-gradient(...) part, not background-color", () => {
    const gradient = { kind: "linearGradient" as const, angleDeg: 180, stops: [{ color: "#DADAD8", position: 0 }, { color: "#F9F7F3", position: 0.0744 }] };
    const computed = computeBoxStyle({ ...createDefaultSectionBlock("s5", null), fill: gradient }, 552);
    const parts = buildContainerExtraStyleParts(computed);
    expect(parts).toContain("background: linear-gradient(180deg, #DADAD8 0%, #F9F7F3 7.44%)");
    expect(parts.some((p) => p.startsWith("background-color:"))).toBe(false);
  });
});

describe("buildBgcolorAttr", () => {
  it("returns an empty string when fill is undefined", () => {
    expect(buildBgcolorAttr(undefined)).toBe("");
  });

  it("builds a bgcolor attribute when fill is set", () => {
    expect(buildBgcolorAttr("#fff9e9")).toBe(' bgcolor="#fff9e9"');
  });

  it("falls back to the first stop's color for a linearGradient fill", () => {
    const gradient = { kind: "linearGradient" as const, angleDeg: 180, stops: [{ color: "#DADAD8", position: 0 }, { color: "#F9F7F3", position: 0.0744 }] };
    expect(buildBgcolorAttr(gradient)).toBe(' bgcolor="#DADAD8"');
  });
});
