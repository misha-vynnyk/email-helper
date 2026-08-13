import { borderToCss, cornerRadiusToCss, escapeAttr, escapeHtml, fillToCss, shadowToCss } from "../cssUtils";
import type { Fill, FrameBorder, FrameShadow } from "../../types";

describe("escapeHtml", () => {
  it("escapes & < > \" ' each individually", () => {
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml("'")).toBe("&#39;");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Hello world 123")).toBe("Hello world 123");
  });
});

describe("escapeAttr", () => {
  it("delegates to the same escaping as escapeHtml", () => {
    expect(escapeAttr(`<a href="x">'y'</a> & more`)).toBe(escapeHtml(`<a href="x">'y'</a> & more`));
  });
});

describe("fillToCss", () => {
  it("renders solid fill as background-color", () => {
    const fill: Fill = { kind: "solid", color: "#112233" };
    expect(fillToCss(fill)).toBe("background-color: #112233;");
  });

  it("renders linearGradient with exact angle and stop percentages (2 stops)", () => {
    const fill: Fill = {
      kind: "linearGradient",
      angleDeg: 90,
      stops: [
        { color: "#000000", position: 0 },
        { color: "#ffffff", position: 1 },
      ],
    };
    expect(fillToCss(fill)).toBe("background: linear-gradient(90deg, #000000 0%, #ffffff 100%);");
  });

  it("renders linearGradient with 3+ stops", () => {
    const fill: Fill = {
      kind: "linearGradient",
      angleDeg: 45,
      stops: [
        { color: "#ff0000", position: 0 },
        { color: "#00ff00", position: 0.5 },
        { color: "#0000ff", position: 1 },
      ],
    };
    expect(fillToCss(fill)).toBe("background: linear-gradient(45deg, #ff0000 0%, #00ff00 50%, #0000ff 100%);");
  });

  it("renders radialGradient with 2 stops", () => {
    const fill: Fill = {
      kind: "radialGradient",
      stops: [
        { color: "#111111", position: 0 },
        { color: "#eeeeee", position: 1 },
      ],
    };
    expect(fillToCss(fill)).toBe("background: radial-gradient(#111111 0%, #eeeeee 100%);");
  });

  it("renders radialGradient with 3+ stops", () => {
    const fill: Fill = {
      kind: "radialGradient",
      stops: [
        { color: "#111111", position: 0 },
        { color: "#888888", position: 0.4 },
        { color: "#eeeeee", position: 1 },
      ],
    };
    expect(fillToCss(fill)).toBe("background: radial-gradient(#111111 0%, #888888 40%, #eeeeee 100%);");
  });
});

describe("cornerRadiusToCss", () => {
  it("renders a uniform border-radius from a number", () => {
    expect(cornerRadiusToCss(12)).toBe("border-radius: 12px;");
  });

  it("renders per-corner border-radius when all 4 corners are given", () => {
    const radius = { topLeft: 1, topRight: 2, bottomRight: 3, bottomLeft: 4 };
    expect(cornerRadiusToCss(radius)).toBe("border-radius: 1px 2px 3px 4px;");
  });

  it("defaults missing per-corner values to 0", () => {
    expect(cornerRadiusToCss({ topLeft: 8 })).toBe("border-radius: 8px 0px 0px 0px;");
  });
});

describe("borderToCss", () => {
  it("renders all 4 sides", () => {
    const border: FrameBorder = {
      top: { widthPx: 1, color: "#111111" },
      right: { widthPx: 2, color: "#222222" },
      bottom: { widthPx: 3, color: "#333333" },
      left: { widthPx: 4, color: "#444444" },
    };
    expect(borderToCss(border)).toBe(
      "border-top: 1px solid #111111; border-right: 2px solid #222222; border-bottom: 3px solid #333333; border-left: 4px solid #444444;",
    );
  });

  it("renders only the sides that are present (top+bottom only)", () => {
    const border: FrameBorder = {
      top: { widthPx: 1, color: "#111111" },
      bottom: { widthPx: 1, color: "#111111" },
    };
    expect(borderToCss(border)).toBe("border-top: 1px solid #111111; border-bottom: 1px solid #111111;");
  });

  it("defaults style to solid when not given", () => {
    const border: FrameBorder = { top: { widthPx: 2, color: "#000000" } };
    expect(borderToCss(border)).toBe("border-top: 2px solid #000000;");
  });

  it("uses an explicit non-default style when given", () => {
    const border: FrameBorder = { top: { widthPx: 2, color: "#000000", style: "dashed" } };
    expect(borderToCss(border)).toBe("border-top: 2px dashed #000000;");
  });
});

describe("shadowToCss", () => {
  it("renders the standard box-shadow string", () => {
    const shadow: FrameShadow = { xPx: 0, yPx: 4, blurPx: 8, color: "rgba(0,0,0,0.25)" };
    expect(shadowToCss(shadow)).toBe("box-shadow: 0px 4px 8px rgba(0,0,0,0.25);");
  });
});
