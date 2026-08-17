import type { RowNode } from "../../types";
import { renderRow } from "../renderRow";

// Two even 50/50 columns — MASTER_CONTENT_WIDTH_PX (600, matching masterShell.ts's own 600px
// Inner content table) * 50% = 300px, the derived (not authored) min-width per column.
const twoColumnRow: RowNode = {
  id: "editor-row",
  type: "row",
  columns: [
    {
      widthPercent: 50,
      children: [
        { id: "left-text", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "Left" }], padding: { top: 0, bottom: 0 } },
      ],
    },
    {
      widthPercent: 50,
      children: [
        { id: "right-text", type: "text", defaultStyle: { fontSizePx: 14 }, runs: [{ text: "Right" }], padding: { top: 0, bottom: 0 } },
      ],
    },
  ],
};

// Uneven columns (40/60) — min-width should scale with widthPercent, not be uniform.
const unevenColumnsRow: RowNode = {
  id: "uneven-row",
  columns: [
    { widthPercent: 40, children: [{ id: "a", type: "spacer", heightPx: 4 }] },
    { widthPercent: 60, children: [{ id: "b", type: "spacer", heightPx: 4 }] },
  ],
  type: "row",
};

// A column with 2+ children — proves it reuses the same stacking helper as a frame's column
// content, not a reimplementation.
const multiChildColumnRow: RowNode = {
  id: "multi-child-row",
  type: "row",
  columns: [
    {
      widthPercent: 100,
      children: [
        { id: "stack-a", type: "spacer", heightPx: 4 },
        { id: "stack-b", type: "spacer", heightPx: 8 },
      ],
    },
  ],
};

describe("renderRow", () => {
  it("renders a 2-column row via the inline-block/min-width technique", () => {
    expect(renderRow(twoColumnRow, "desktop")).toMatchSnapshot();
  });

  it("derives min-width from widthPercent * MASTER_CONTENT_WIDTH_PX (600), not a fixed constant", () => {
    const html = renderRow(twoColumnRow, "desktop");
    expect(html).toContain("min-width: 300px;");
    expect(html).toContain('width="50%"');
  });

  it("scales min-width per column when widths are uneven", () => {
    const html = renderRow(unevenColumnsRow, "desktop");
    expect(html).toContain("min-width: 240px;"); // 600 * 40%
    expect(html).toContain("min-width: 360px;"); // 600 * 60%
  });

  it("uses the inline-block/font-size:0 stacking attributes on every column cell", () => {
    const html = renderRow(twoColumnRow, "desktop");
    expect(html).toContain('class="inline-block-element"');
    expect(html.match(/display: inline-block;/g)).toHaveLength(2);
    expect(html).toContain("font-size: 0; line-height: 0; mso-line-height-rule: exactly; text-align: center;");
  });

  it("self-wraps in a neutral row with no padding of its own", () => {
    const html = renderRow(twoColumnRow, "desktop");
    expect(html.startsWith('<tr><td style="margin: 0; padding: 0;">')).toBe(true);
  });

  it("stacks 2+ children within a single column using the shared placement helper", () => {
    const html = renderRow(multiChildColumnRow, "desktop");
    expect(html).toContain("height=\"4\"");
    expect(html).toContain("height=\"8\"");
  });
});
