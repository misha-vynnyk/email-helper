/**
 * Review checklist for every generic-rendering code path (frame/text/image/spacer/row +
 * the shared cssUtils helpers) — NOT a replacement for renderNode.test.ts's behavioral
 * coverage. Purpose: put the actual generated HTML for every meaningful branch in front of
 * a human reviewer, ordered by module, so each case can be confirmed or rejected against
 * the user's own real markup conventions.
 *
 * `toMatchSnapshot()` (external file, `__snapshots__/genericPrimitivesReview.test.ts.snap`)
 * rather than `toMatchInlineSnapshot()` — this repo's installed prettier version breaks
 * jest-snapshot's inline auto-writer (`prettier.resolveConfig.sync is not a function`), a
 * pre-existing tooling mismatch unrelated to figmaImport. To review: open the `.snap` file
 * next to this one and read each generated string directly, or run
 * `npx jest src/figmaImport/render/__tests__/genericPrimitivesReview.test.ts` yourself and
 * inspect failures. If a case is wrong, the fix belongs in the renderer — then re-run with
 * `-u` to refresh the `.snap` file with the corrected output.
 */
import type { FrameNode, ImageNode, RowNode, SpacerNode, TextNode } from "../../types";
import { bgcolorAttr, borderToCss, cornerRadiusToCss, fillToCss, shadowToCss, wrapNameComment } from "../cssUtils";
import { renderNode } from "../renderNode";

describe("cssUtils — shared style-translation helpers", () => {
  it("fillToCss: solid", () => {
    expect(fillToCss({ kind: "solid", color: "#F9F9F9" })).toMatchSnapshot();
  });

  it("fillToCss: linear gradient", () => {
    expect(
      fillToCss({
        kind: "linearGradient",
        angleDeg: 104.73,
        stops: [
          { color: "#162D6A", position: 0.19798 },
          { color: "#01050D", position: 0.92438 },
        ],
      })
    ).toMatchSnapshot();
  });

  it("cornerRadiusToCss: uniform number", () => {
    expect(cornerRadiusToCss(8)).toMatchSnapshot();
  });

  it("cornerRadiusToCss: per-corner object, partially specified", () => {
    expect(cornerRadiusToCss({ topLeft: 8, topRight: 8 })).toMatchSnapshot();
  });

  it("borderToCss: all four sides", () => {
    const side = { widthPx: 1, color: "#E8E8E8", style: "solid" as const };
    expect(borderToCss({ top: side, right: side, bottom: side, left: side })).toMatchSnapshot();
  });

  it("shadowToCss", () => {
    expect(shadowToCss({ xPx: 0, yPx: 4, blurPx: 4, color: "rgba(0,0,0,0.25)" })).toMatchSnapshot();
  });

  it("bgcolorAttr: solid fill", () => {
    expect(bgcolorAttr({ kind: "solid", color: "#FCBF24" })).toMatchSnapshot();
  });

  it("bgcolorAttr: gradient fill has no bgcolor= equivalent", () => {
    expect(bgcolorAttr({ kind: "linearGradient", angleDeg: 0, stops: [{ color: "#000", position: 0 }, { color: "#fff", position: 1 }] })).toMatchSnapshot();
  });

  it("wrapNameComment: wraps with leading/trailing newline so comments never glue to sibling markup", () => {
    expect(wrapNameComment("SponsoredNote", "<tr><td>x</td></tr>")).toMatchSnapshot();
  });
});

describe("renderSpacer", () => {
  it("basic height", () => {
    const node: SpacerNode = { id: "s1", type: "spacer", heightPx: 24 };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });
});

describe("renderImage", () => {
  it("fluid width, no href, default center align", () => {
    const node: ImageNode = { id: "img1", type: "image", altDescription: "Decorative divider graphic", widthPx: 600, padding: { top: 0, bottom: 0 } };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("fixed width mode (small icon), never stretches past widthPx", () => {
    const node: ImageNode = { id: "icon1", type: "image", altDescription: "icon", widthPx: 20, widthMode: "fixed", padding: { top: 0, bottom: 0 } };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("wraps in <a target=_blank> when href is set", () => {
    const node: ImageNode = { id: "img2", type: "image", altDescription: "banner", widthPx: 600, href: "urlhere", padding: { top: 0, bottom: 0 } };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("omits the style attribute entirely when both padding sides are zero", () => {
    const node: ImageNode = { id: "img3", type: "image", altDescription: "x", widthPx: 600, padding: { top: 0, bottom: 0 } };
    expect(renderNode(node, "desktop")).not.toContain('style=""');
  });

  it("left-aligned, with vertical padding", () => {
    const node: ImageNode = { id: "img4", type: "image", altDescription: "logo", widthPx: 120, align: "left", padding: { top: 8, bottom: 16 } };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });
});

describe("renderText", () => {
  it("single run, default style only, no padding", () => {
    const node: TextNode = {
      id: "t1",
      type: "text",
      defaultStyle: { fontFamily: "Inter", fontWeight: 400, fontSizePx: 14, color: "#000000" },
      runs: [{ text: "Plain paragraph." }],
      padding: { top: 0, bottom: 0 },
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("multiple runs, per-run overrides (color/href/fontWeight)", () => {
    const node: TextNode = {
      id: "t2",
      type: "text",
      defaultStyle: { fontFamily: "Montserrat", fontSizePx: 18, color: "#000000" },
      runs: [
        { text: "I have a fungal infection...", href: "urlhere", color: "#0066FF", fontWeight: 700 },
        { text: " - ad by Company -", color: "#0066FF", fontSizePx: 12 },
      ],
      padding: { top: 0, bottom: 0 },
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("letterSpacing, italic, underline, uppercase transform", () => {
    const node: TextNode = {
      id: "t3",
      type: "text",
      defaultStyle: { fontFamily: "Inter", fontSizePx: 14, letterSpacing: 0.5, italic: true, underline: true, textTransform: "uppercase" },
      runs: [{ text: "Sponsored Content" }],
      padding: { top: 0, bottom: 0 },
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("center align + explicit lineHeight + vertical padding", () => {
    const node: TextNode = {
      id: "t4",
      type: "text",
      align: "center",
      defaultStyle: { fontFamily: "Inter", fontSizePx: 13, color: "#000000", lineHeight: 1.5 },
      runs: [{ text: "© 2026 Kitchen Table Insights. All rights reserved." }],
      padding: { top: 4, bottom: 4 },
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });
});

describe("renderFrame — plain containers", () => {
  it("column frame, no fill/border/radius/shadow, fluid width", () => {
    const node: FrameNode = {
      id: "content-wrapper",
      type: "frame",
      direction: "column",
      gap: 24,
      padding: { top: 12, right: 0, bottom: 0, left: 0 },
      children: [{ id: "t", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "x" }], padding: { top: 0, bottom: 0 } }],
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("filled + bordered card with padding — 'SponsoredNote' style", () => {
    const node: FrameNode = {
      id: "card1",
      type: "frame",
      direction: "column",
      gap: 16,
      padding: { top: 12, right: 12, bottom: 12, left: 12 },
      fill: { kind: "solid", color: "#F9F9F9" },
      border: { top: { widthPx: 1, color: "#E8E8E8" }, right: { widthPx: 1, color: "#E8E8E8" }, bottom: { widthPx: 1, color: "#E8E8E8" }, left: { widthPx: 1, color: "#E8E8E8" } },
      children: [{ id: "t", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "x" }], padding: { top: 0, bottom: 0 } }],
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("cornerRadius + shadow switches to border-collapse:separate", () => {
    const node: FrameNode = {
      id: "card2",
      type: "frame",
      direction: "column",
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      fill: { kind: "solid", color: "#ffffff" },
      cornerRadius: 8,
      shadow: { xPx: 0, yPx: 4, blurPx: 4, color: "rgba(0,0,0,0.25)" },
      children: [{ id: "t", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "x" }], padding: { top: 0, bottom: 0 } }],
    };
    const html = renderNode(node, "desktop");
    expect(html).toContain("border-collapse: collapse");
    expect(html).toMatchSnapshot();
  });

  it("numeric width caps both the outer <td> and the inner <table>", () => {
    const node: FrameNode = {
      id: "boxed",
      type: "frame",
      direction: "column",
      width: 528,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      children: [{ id: "t", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "x" }], padding: { top: 0, bottom: 0 } }],
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it('width:"hug" gets no width CSS at all, just width="auto" attribute', () => {
    const node: FrameNode = {
      id: "hugged",
      type: "frame",
      direction: "column",
      width: "hug",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      children: [{ id: "t", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "x" }], padding: { top: 0, bottom: 0 } }],
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });
});

describe("renderFrame — column gap folding", () => {
  it("folds gap into the bottom padding of a self-wrapping child instead of an extra spacer row", () => {
    const node: FrameNode = {
      id: "stack",
      type: "frame",
      direction: "column",
      gap: 24,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      children: [
        { id: "a", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "a" }], padding: { top: 0, bottom: 0 } },
        { id: "b", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "b" }], padding: { top: 0, bottom: 0 } },
      ],
    };
    const html = renderNode(node, "desktop");
    expect(html).toContain("padding-bottom: 24px");
    expect(html).not.toContain("&nbsp;"); // no dedicated empty spacer row between the two children
  });
});

describe("renderFrame — row direction", () => {
  it("plain row, gap becomes padding-right on every non-last cell", () => {
    const node: FrameNode = {
      id: "row1",
      type: "frame",
      direction: "row",
      gap: 45,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      children: [
        { id: "a", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "Privacy Policy" }], padding: { top: 0, bottom: 0 } },
        { id: "b", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "Terms & Conditions" }], padding: { top: 0, bottom: 0 } },
      ],
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("justify:spaceBetween with exactly 2 children pushes the last cell right via a nested align=right table", () => {
    const node: FrameNode = {
      id: "row2",
      type: "frame",
      direction: "row",
      justify: "spaceBetween",
      width: 528,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      children: [
        { id: "a", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "left" }], padding: { top: 0, bottom: 0 } },
        { id: "b", type: "image", altDescription: "logo", widthPx: 60, padding: { top: 0, bottom: 0 } },
      ],
    };
    const html = renderNode(node, "desktop");
    expect(html).toContain('align="right"');
    expect(html).toMatchSnapshot();
  });
});

describe("renderFrame — visibility", () => {
  it("skips a mobileOnly node on desktop, renders empty string", () => {
    const node: FrameNode = {
      id: "mob-only",
      type: "frame",
      direction: "column",
      visibility: "mobileOnly",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      children: [],
    };
    expect(renderNode(node, "desktop")).toBe("");
  });
});

describe("renderRow (percentage columns that stack on narrow viewports)", () => {
  it("two 50% columns, each carrying its own children", () => {
    const node: RowNode = {
      id: "editorRow",
      type: "row",
      columns: [
        { widthPercent: 50, children: [{ id: "img", type: "image", altDescription: "photo", widthPx: 260, padding: { top: 0, bottom: 0 } }] },
        { widthPercent: 50, children: [{ id: "txt", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "caption" }], padding: { top: 0, bottom: 0 } }] },
      ],
    };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });
});
