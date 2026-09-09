import { designFileSchema } from "../../schema";
import type { ButtonNode, CardListNode, DesignNode } from "../../types";
import { renderButton } from "../renderButton";
import { renderCardList } from "../renderCardList";
import { renderDocumentContent, renderNode } from "../renderNode";

// "SponsoredNote" fixture — frame+frame+text, no button/divider/image. Values taken
// literally from the "Sponsored Content" example in FIGMA_TEMPLATE_IMPORT_PLAN.md
// (outer frame's `padding` added — the plan's example omits it, but the schema
// requires `padding` on every FrameNode; text nodes' `padding` added for the same reason,
// 2026-08-13 rewrite — see "Text/Image become self-wrapping" in the plan).
const sponsoredNote: DesignNode = {
  id: "sponsored-note-1",
  type: "frame",
  direction: "column",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  fill: { kind: "solid", color: "#FFF8E6" },
  children: [
    {
      id: "sn1-title",
      type: "frame",
      direction: "row",
      fill: { kind: "solid", color: "#FCBF24" },
      padding: { top: 12, right: 20, bottom: 12, left: 20 },
      children: [
        {
          id: "sn1-title-text",
          type: "text",
          defaultStyle: { fontSizePx: 18, fontFamily: "Montserrat", fontWeight: 700 },
          runs: [{ text: "Sponsored Content" }],
          padding: { top: 0, bottom: 0 },
        },
      ],
    },
    {
      id: "sn1-item",
      type: "frame",
      direction: "column",
      padding: { top: 12, right: 20, bottom: 12, left: 20 },
      children: [
        {
          id: "sn1-item-text",
          type: "text",
          defaultStyle: { fontSizePx: 18, fontFamily: "Montserrat" },
          runs: [
            { text: "I have a fungal infection...", href: "urlhere", color: "#0066FF", fontWeight: 700 },
            { text: "- ad by Company -", color: "#0066FF", fontSizePx: 12 },
          ],
          padding: { top: 0, bottom: 0 },
        },
      ],
    },
  ],
};

// Matches the "content-image row" example verbatim (widthPx/padding literal from it).
const imageFixture: DesignNode = {
  id: "hero-image",
  type: "image",
  altDescription: "Video preview of the newsletter header",
  widthPx: 260,
  padding: { top: 14, bottom: 14 },
  href: "urlhere",
};

const spacerFixture: DesignNode = {
  id: "spacer-1",
  type: "spacer",
  heightPx: 24,
};

// Values taken literally from the user's own real footer-button markup (2026-08-13 rewrite —
// this is now the canonical no-icon button, replacing the earlier button-no-icon shape).
const buttonFixture: ButtonNode = {
  id: "btn-learn-more",
  type: "button",
  label: "Learn more",
  href: "urlhere",
  background: "#333333",
  textColor: "#ffffff",
  cornerRadius: 4,
  widthPx: 200,
  targetHeightPx: 40,
  fontFamily: "Roboto",
  fontSizePx: 14,
  fontWeight: 700,
  lineHeight: 1,
  paddingTopPx: 12,
  paddingBottomPx: 12,
  paddingLeftPx: 6,
  paddingRightPx: 6,
};

const outlineButtonFixture: ButtonNode = {
  ...buttonFixture,
  id: "btn-outline",
  background: undefined,
  border: { widthPx: 1, color: "#ffffff" },
};

// Values taken literally from the user's own filled-in "button-with-icon-left/right"
// blocks in figma-to-html/content-blocks-template.html — this path is UNCHANGED by the
// 2026-08-13 footer-button rewrite (see ButtonIcon in types.ts: no longer an ImageNode, so
// no id/type/padding/align/widthMode fields belong here).
const iconButtonFixture: DesignNode = {
  id: "btn-unsubscribe",
  type: "button",
  label: "Unsubscribe",
  href: "urlhere",
  background: "#333333",
  textColor: "#ffffff",
  cornerRadius: 4,
  widthPx: 200,
  targetHeightPx: 42,
  fontFamily: "Manrope",
  fontSizePx: 16,
  fontWeight: 400,
  lineHeight: 1,
  paddingTopPx: 9,
  paddingBottomPx: 9,
  paddingLeftPx: 8,
  paddingRightPx: 8,
  icon: {
    altDescription: "---",
    side: "left",
    gapPx: 5,
    widthPx: 20,
    heightPx: 20,
  },
};

const dividerFixture: DesignNode = {
  id: "divider-1",
  type: "divider",
  color: "#676767",
};

// Values taken literally from the user's own filled-in "divider-logo" block in
// figma-to-html/content-blocks-template.html.
const dividerLogoFixture: DesignNode = {
  id: "divider-logo-1",
  type: "dividerLogo",
  widthPx: 520,
  lineColor: "#676767",
  iconAltDescription: "Icon",
  iconWidthPx: 35,
  iconGapPx: 13,
};

// Values taken literally from the user's own filled-in "header-single-image" block in
// figma-to-html/content-blocks-template.html.
const headerImageFixture: DesignNode = {
  id: "header-1",
  type: "headerImage",
  widthPx: 600,
  altDescription: "Logo",
  href: "urlhere",
};

const verticalFrameWithGap: DesignNode = {
  id: "stack-1",
  type: "frame",
  direction: "column",
  padding: { top: 8, right: 8, bottom: 8, left: 8 },
  gap: 16,
  children: [
    { id: "stack-1-a", type: "spacer", heightPx: 4 },
    { id: "stack-1-b", type: "spacer", heightPx: 4 },
    { id: "stack-1-c", type: "spacer", heightPx: 4 },
  ],
};

const rowFrameWithGap: DesignNode = {
  id: "row-gap-1",
  type: "frame",
  direction: "row",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: 10,
  children: [
    { id: "row-gap-1-a", type: "spacer", heightPx: 4 },
    { id: "row-gap-1-b", type: "spacer", heightPx: 4 },
    { id: "row-gap-1-c", type: "spacer", heightPx: 4 },
  ],
};

function rowWithChildCount(id: string, count: number, justify: "spaceBetween"): DesignNode {
  return {
    id,
    type: "frame",
    direction: "row",
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    justify,
    children: Array.from({ length: count }, (_, i) => ({
      id: `${id}-${i}`,
      type: "spacer" as const,
      heightPx: 4,
    })),
  };
}

function frameWithWidth(id: string, width: number | "fill" | "hug"): DesignNode {
  return {
    id,
    type: "frame",
    direction: "column",
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    width,
    children: [{ id: `${id}-a`, type: "spacer", heightPx: 4 }],
  };
}

const frameWithBorderNoRadius: DesignNode = {
  id: "frame-border-collapse",
  type: "frame",
  direction: "column",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  border: { top: { widthPx: 1, color: "#000000" } },
  children: [{ id: "frame-border-collapse-a", type: "spacer", heightPx: 4 }],
};

const frameWithRadiusAndShadow: DesignNode = {
  ...frameWithBorderNoRadius,
  id: "frame-border-separate",
  cornerRadius: 8,
  shadow: { xPx: 0, yPx: 2, blurPx: 4, color: "#00000033" },
};

const thickDividerFixture: DesignNode = { id: "divider-thick", type: "divider", color: "#676767", thicknessPx: 3 };

const thickDividerLogoFixture: DesignNode = { ...dividerLogoFixture, id: "divider-logo-thick", lineThicknessPx: 2 };

const headerImageNoHrefFixture: DesignNode = { ...headerImageFixture, id: "header-no-href", href: undefined };

const uppercaseButtonFixture: ButtonNode = { ...buttonFixture, id: "btn-uppercase", textTransform: "uppercase" };

const perCornerRadiusButtonFixture: ButtonNode = {
  ...buttonFixture,
  id: "btn-per-corner-radius",
  cornerRadius: { topLeft: 4, topRight: 4, bottomRight: 0, bottomLeft: 0 },
};

const imageNoHrefFixture: DesignNode = { ...imageFixture, id: "image-no-href", href: undefined };

const fixedIconImageFixture: DesignNode = {
  id: "icon-image",
  type: "image",
  altDescription: "A small icon",
  widthPx: 24,
  widthMode: "fixed",
  align: "left",
  padding: { top: 0, bottom: 0 },
};

const styledTextFixture: DesignNode = {
  id: "text-styled",
  type: "text",
  defaultStyle: { fontSizePx: 16, letterSpacing: 2, italic: true, underline: true },
  runs: [{ text: "Styled run" }],
  padding: { top: 0, bottom: 0 },
};

// 2026-08-13 rewrite fixtures — Container/Row/ButtonRow + the discrimination logic between
// self-wrapping (frame/text/image/button/buttonRow/row) and bare-fragment (everything else)
// children. See "Review fixes applied" in FIGMA_TEMPLATE_IMPORT_PLAN.md.

const rowWithSelfWrappingChildFixture: DesignNode = {
  id: "row-self-wrap-1",
  type: "frame",
  direction: "row",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  children: [
    {
      id: "row-self-wrap-1-text",
      type: "text",
      defaultStyle: { fontSizePx: 14 },
      runs: [{ text: "Nav item" }],
      padding: { top: 0, bottom: 0 },
    },
  ],
};

const frameWithDividerChildFixture: DesignNode = {
  id: "frame-with-divider-child",
  type: "frame",
  direction: "column",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  children: [dividerFixture],
};

const frameWithButtonChildFixture: DesignNode = {
  id: "frame-with-button-child",
  type: "frame",
  direction: "column",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  children: [buttonFixture],
};

// Mixed self-wrapping (text, not last) + bare-fragment (divider, last) siblings under a
// non-zero gap — corrected 2026-08-13 against real content (KitchenTableInsight.com): gap must
// land on EVERY non-last child regardless of self-wrapping-ness, wrapping a self-wrapping
// child's own <tr> in an extra gap-carrying <td> when it isn't last (see renderColumnContent's
// "CORRECTION" comment in renderNode.ts) — a self-wrapping child that IS last still gets none,
// same as a bare-fragment last child.
const mixedGapFixture: DesignNode = {
  id: "mixed-gap-1",
  type: "frame",
  direction: "column",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: 20,
  children: [
    {
      id: "mixed-gap-1-text",
      type: "text",
      defaultStyle: { fontSizePx: 14 },
      runs: [{ text: "Before the divider" }],
      padding: { top: 0, bottom: 0 },
    },
    dividerFixture,
  ],
};

// The real-world common case this correction targets: a column frame whose children are OTHER
// frames (both self-wrapping) — gap must space them apart even though neither is a
// bare-fragment type.
const twoNestedFramesWithGapFixture: DesignNode = {
  id: "nested-frames-gap-1",
  type: "frame",
  direction: "column",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  gap: 24,
  children: [
    {
      id: "nested-frames-gap-1-a",
      type: "frame",
      direction: "column",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      children: [{ id: "nested-frames-gap-1-a-spacer", type: "spacer", heightPx: 4 }],
    },
    {
      id: "nested-frames-gap-1-b",
      type: "frame",
      direction: "column",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      children: [{ id: "nested-frames-gap-1-b-spacer", type: "spacer", heightPx: 4 }],
    },
  ],
};

const rowNodeFixture: DesignNode = {
  id: "editor-row-1",
  type: "row",
  columns: [
    {
      widthPercent: 50,
      children: [
        {
          id: "editor-row-1-left-text",
          type: "text",
          defaultStyle: { fontSizePx: 14 },
          runs: [{ text: "Left column" }],
          padding: { top: 0, bottom: 0 },
        },
      ],
    },
    {
      widthPercent: 50,
      children: [
        {
          id: "editor-row-1-right-text",
          type: "text",
          defaultStyle: { fontSizePx: 14 },
          runs: [{ text: "Right column" }],
          padding: { top: 0, bottom: 0 },
        },
      ],
    },
  ],
};

const buttonRowNodeFixture: DesignNode = {
  id: "footer-buttons-1",
  type: "buttonRow",
  buttons: [buttonFixture, { ...buttonFixture, id: "btn-terms", label: "Terms & Conditions" }],
};

// `node.name` → `<!-- Name --> ... <!-- Name end -->` fixtures (2026-08-14) — the convention
// `templateManager.extractBlocks()` already parses, now actually wired into `renderNode()`.
const namedFrameFixture: DesignNode = {
  id: "named-frame-1",
  name: "TestBlock",
  type: "frame",
  direction: "column",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  children: [{ id: "named-frame-1-a", type: "spacer", heightPx: 4 }],
};

const frameWithNamedChildFixture: DesignNode = {
  id: "frame-with-named-child",
  type: "frame",
  direction: "column",
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  children: [
    {
      id: "frame-with-named-child-inner",
      name: "InnerItem",
      type: "frame",
      direction: "column",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      children: [{ id: "frame-with-named-child-inner-a", type: "spacer", heightPx: 4 }],
    },
  ],
};

const namedPromoCopyFixture: DesignNode = { id: "promo-named", name: "PromoBlock", type: "promoCopy" };

const namedImageFixture: DesignNode = { ...imageFixture, id: "named-image", name: "Header" };

const namedDividerFixture: DesignNode = { ...dividerFixture, id: "named-divider", name: "Divider" };

// Dispatch-integration fixture for the new "cardList" type (see renderCardList.test.ts for the
// dedicated coverage of the fixed-structure card mechanism itself).
const cardListFixture: CardListNode = {
  id: "sponsored-cards-dispatch",
  type: "cardList",
  variant: "sponsoredLink",
  gap: 16,
  cards: [
    {
      id: "dispatch-card-1",
      padding: { top: 0, right: 8, bottom: 0, left: 0 },
      title: {
        id: "dispatch-card-1-title",
        type: "text",
        defaultStyle: { fontFamily: "Montserrat", fontWeight: 700, fontSizePx: 16, color: "#1D77D7", underline: true, href: "urlhere" },
        runs: [{ text: "• Lorem ipsum dolor sit amet" }],
        padding: { top: 0, bottom: 0 },
      },
      secondary: {
        id: "dispatch-card-1-partner",
        type: "text",
        defaultStyle: { fontFamily: "Montserrat", fontWeight: 300, fontSizePx: 16, color: "#ADADAD" },
        runs: [{ text: "(partner's name)" }],
        padding: { top: 0, bottom: 0 },
      },
    },
  ],
};

describe("renderNode", () => {
  it("renders the SponsoredNote fixture", () => {
    expect(renderNode(sponsoredNote, "desktop")).toMatchSnapshot();
  });

  it("renders an image node, wrapped in a link when href is set", () => {
    expect(renderNode(imageFixture, "desktop")).toMatchSnapshot();
  });

  it("renders a fixed-width (non-stretching) image for the icon widthMode", () => {
    const html = renderNode(fixedIconImageFixture, "desktop");
    expect(html).toContain("width: 24px; max-width: 24px;");
    expect(html).not.toContain("width: 100%;");
    expect(html).toContain('align="left"');
  });

  it("renders a spacer node", () => {
    expect(renderNode(spacerFixture, "desktop")).toMatchSnapshot();
  });

  it("renders a column frame with padding-bottom gap between children (no dedicated spacer row)", () => {
    expect(renderNode(verticalFrameWithGap, "desktop")).toMatchSnapshot();
  });

  it("skips a desktopOnly node when rendering for mobile", () => {
    const node: DesignNode = { ...spacerFixture, visibility: "desktopOnly" };
    expect(renderNode(node, "mobile")).toBe("");
    expect(renderNode(node, "desktop")).not.toBe("");
  });

  it("renders a promoCopy node as the fixed literal stub", () => {
    const node: DesignNode = { id: "x", type: "promoCopy" };
    const html = renderNode(node, "desktop");
    expect(html).toContain("<!--=== PROMO-COPY ===-->");
    expect(html).toContain("<!--=== PROMO-COPY-end ===-->");
  });

  it("renders the button-no-icon fixture", () => {
    expect(renderNode(buttonFixture, "desktop")).toMatchSnapshot();
  });

  it("renders an outline-only button (no background) with its border", () => {
    expect(renderNode(outlineButtonFixture, "desktop")).toMatchSnapshot();
  });

  it("renders a button with a left-side icon", () => {
    expect(renderNode(iconButtonFixture, "desktop")).toMatchSnapshot();
  });

  it("renders a button with a right-side icon", () => {
    const node: DesignNode = { ...iconButtonFixture, id: "btn-unsubscribe-right", icon: { ...iconButtonFixture.icon!, side: "right" } };
    expect(renderNode(node, "desktop")).toMatchSnapshot();
  });

  it("renders the divider-plain fixture", () => {
    expect(renderNode(dividerFixture, "desktop")).toMatchSnapshot();
  });

  it("renders the divider-logo fixture", () => {
    expect(renderNode(dividerLogoFixture, "desktop")).toMatchSnapshot();
  });

  it("renders the header-single-image fixture", () => {
    expect(renderNode(headerImageFixture, "desktop")).toMatchSnapshot();
  });

  it("renders the editor 2-column row fixture", () => {
    expect(renderNode(rowNodeFixture, "desktop")).toMatchSnapshot();
  });

  it("renders the footer button-row fixture", () => {
    expect(renderNode(buttonRowNodeFixture, "desktop")).toMatchSnapshot();
  });

  it("dispatches a cardList node to renderCardList, matching its output exactly", () => {
    expect(renderNode(cardListFixture, "desktop")).toBe(renderCardList(cardListFixture));
  });

  it("does not double-wrap a top-level cardList node in an extra <tr><td>", () => {
    const html = renderDocumentContent([cardListFixture], "desktop");
    expect(html).toBe(renderNode(cardListFixture, "desktop"));
  });

  it("wraps the last cell in an align=right table for justify:spaceBetween with 2 children", () => {
    const html = renderNode(rowWithChildCount("row-spread-2", 2, "spaceBetween"), "desktop");
    expect(html).toContain('<td align="right" style="">');
    expect(html).toContain('<table role="presentation" border="0" cellpadding="0" cellspacing="0" align="right"');
  });

  it("pushes only the last cell right for justify:spaceBetween with 3+ children too (no per-child align yet)", () => {
    // Current behavior, not a "fall back to start": the last child always gets the
    // align="right" wrapper for any row with 2+ children — there's no per-middle-child
    // alignment (see the "Full per-child align" open question in figma-import-status.md).
    const html = renderNode(rowWithChildCount("row-spread-3", 3, "spaceBetween"), "desktop");
    const rightWrappedCellCount = (html.match(/<td align="right"/g) ?? []).length;
    expect(rightWrappedCellCount).toBe(1);
  });

  it("renders padding-right gap between row children, but not after the last one", () => {
    const html = renderNode(rowFrameWithGap, "desktop");
    expect(html).toContain('style="padding-right: 10px;"');
    // 3 children, gap between each of the 2 non-last pairs => exactly 2 gap declarations
    expect(html.match(/padding-right: 10px;/g)).toHaveLength(2);
    expect(html).toContain('<td style="">');
  });

  it("caps width to a number, on both the wrapping <td> and the inner <table>", () => {
    const html = renderNode(frameWithWidth("frame-width-number", 240), "desktop");
    // 2026-08-17: the width cap (and any fill/border) now lives on the <td> itself, not just
    // the inner table — see visualBoxStyle's comment in renderNode.ts for why. 2026-08-19: the
    // `width=` HTML attribute itself moved off the <td> entirely (real reference markup never
    // carries it there) — only the inner <table> carries `width="240"` now; the <td> keeps only
    // the `max-width` CSS cap, still present on both boxes.
    expect(html).toContain('<td align="center" style="');
    expect(html.match(/width="240"/g)).toHaveLength(1);
    expect(html.match(/max-width: 240px;/g)).toHaveLength(2);
  });

  it("writes a frame's own padding in full longhand, one non-zero side at a time — never the 4-value shorthand", () => {
    // sn1-title inside sponsoredNote has padding {top:12, right:20, bottom:12, left:20} — every
    // side non-zero, so all four longhand declarations appear; there is no bare `padding:`
    // shorthand anywhere in the output (2026-08-14, user feedback: some email clients have
    // documented bugs parsing/applying the 4-value shorthand per side reliably).
    const html = renderNode(sponsoredNote, "desktop");
    expect(html).toContain("padding-top: 12px; padding-right: 20px; padding-bottom: 12px; padding-left: 20px;");
    // a differentiated 4-value px shorthand (e.g. "padding: 12px 20px 12px 20px") never appears
    // — only the harmless single-value "padding: 0;" resets used elsewhere for visual tables.
    expect(html).not.toMatch(/padding:\s*\d+px\s+\d+px\s+\d+px\s+\d+px/);
  });

  it("omits a zero-value side from a frame's own padding instead of writing padding-Xpx: 0px", () => {
    const node: DesignNode = {
      id: "frame-partial-padding",
      type: "frame",
      direction: "column",
      padding: { top: 10, right: 0, bottom: 0, left: 0 },
      children: [{ id: "frame-partial-padding-a", type: "spacer", heightPx: 4 }],
    };
    const html = renderNode(node, "desktop");
    expect(html).toContain('<td align="center" style="padding-top: 10px; margin: 0; width: 100%;">');
  });

  // align="center" on a frame's own <td> is unconditional (2026-08-17) — confirmed against the
  // user's own real container markup, where both a numeric-width outer container and a fluid
  // 100%-width inner container carry it; it no longer varies with `width`.
  it("renders width:fill as width=100%, still align=\"center\" on its own <td>", () => {
    const html = renderNode(frameWithWidth("frame-width-fill", "fill"), "desktop");
    expect(html).toContain('width="100%" style=');
    expect(html).toContain('align="center"');
  });

  it("renders width:hug as width=auto with no forced width CSS, still align=\"center\" on its own <td>", () => {
    const html = renderNode(frameWithWidth("frame-width-hug", "hug"), "desktop");
    expect(html).toContain('width="auto" style=');
    expect(html).toContain('align="center"');
    expect(html).not.toContain("width: 100%;");
  });

  it("uses border-collapse:collapse when the frame has a border but no cornerRadius", () => {
    const html = renderNode(frameWithBorderNoRadius, "desktop");
    expect(html).toContain("border-collapse: collapse;");
    expect(html).toContain("border-top: 1px solid #000000;");
  });

  it("includes shadow/radius CSS on the frame's own <td> when cornerRadius is set", () => {
    // 2026-08-17: fill/border/cornerRadius/shadow moved to the frame's own <td> (see
    // visualBoxStyle) — the inner content <table> has no visual identity of its own anymore, so
    // it no longer needs the old "border-collapse:separate for radius" special case and is
    // always plain `collapse`.
    const html = renderNode(frameWithRadiusAndShadow, "desktop");
    expect(html).toContain("border-collapse: collapse;");
    expect(html).not.toContain("border-collapse: separate;");
    expect(html).toContain("border-radius: 8px;");
    expect(html).toContain("box-shadow: 0px 2px 4px #00000033;");
  });

  it("renders a mobileOnly node when the viewport is mobile, and hides it on desktop", () => {
    const node: DesignNode = { ...spacerFixture, visibility: "mobileOnly" };
    expect(renderNode(node, "mobile")).not.toBe("");
    expect(renderNode(node, "desktop")).toBe("");
  });

  it("renders an explicit divider thicknessPx instead of the default", () => {
    const html = renderNode(thickDividerFixture, "desktop");
    expect(html).toContain("border-bottom: 3px solid #676767;");
  });

  it("renders an explicit dividerLogo lineThicknessPx instead of the default", () => {
    const html = renderNode(thickDividerLogoFixture, "desktop");
    expect(html).toContain("border-bottom: 2px solid #676767;");
  });

  it("renders a header image without a wrapping <a> when href is absent", () => {
    const html = renderNode(headerImageNoHrefFixture, "desktop");
    expect(html).not.toContain("<a ");
    expect(html).toContain("<img");
  });

  it("renders a button textTransform", () => {
    const html = renderNode(uppercaseButtonFixture, "desktop");
    expect(html).toContain("text-transform: uppercase;");
  });

  it("renders a button cornerRadius as a per-corner object", () => {
    const html = renderNode(perCornerRadiusButtonFixture, "desktop");
    expect(html).toContain("border-radius: 4px 4px 0px 0px;");
  });

  it("renders an image node without a wrapping <a> when href is absent", () => {
    const html = renderNode(imageNoHrefFixture, "desktop");
    expect(html).not.toContain("<a ");
    expect(html).toContain("<img");
  });

  it("renders text letterSpacing, italic and underline", () => {
    const html = renderNode(styledTextFixture, "desktop");
    expect(html).toContain("letter-spacing: 2px;");
    expect(html).toContain("font-style: italic;");
    expect(html).toContain("text-decoration: underline;");
  });

  it("omits zero-value padding declarations entirely on text's own <td> (self-wrapping row)", () => {
    // styledTextFixture's padding is {top:0, bottom:0} — both sides are zero, so neither
    // padding-top nor padding-bottom appears at all (2026-08-14, user feedback: "only write
    // paddings that have real values" — an omitted longhand is already 0 by CSS's initial
    // value, so this changes nothing about the rendered result).
    const html = renderNode(styledTextFixture, "desktop");
    expect(html).toContain("<tr><td style=");
    expect(html).not.toContain("padding-top:");
    expect(html).not.toContain("padding-bottom:");
  });

  it("writes only the non-zero padding sides, in full longhand, on text's own <td>", () => {
    const node: DesignNode = { ...styledTextFixture, id: "text-padded", padding: { top: 8, bottom: 0 } };
    const html = renderNode(node, "desktop");
    expect(html).toContain("padding-top: 8px;");
    expect(html).not.toContain("padding-bottom:");
  });

  it("wraps a self-wrapping child (text) in its own nested <table> when placed in a row-direction cell", () => {
    const html = renderNode(rowWithSelfWrappingChildFixture, "desktop");
    expect(html).toContain(
      '<td style=""><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="',
    );
  });

  it("wraps a bare-fragment child (divider) in <tr><td> when placed in a column frame", () => {
    const html = renderNode(frameWithDividerChildFixture, "desktop");
    expect(html).toContain(`<tr><td>${renderNode(dividerFixture, "desktop")}</td></tr>`);
  });

  it("does not double-wrap a self-wrapping child (button) placed in a column frame", () => {
    const html = renderNode(frameWithButtonChildFixture, "desktop");
    expect(html).toContain(renderButton(buttonFixture));
    expect(html).not.toContain("<td><tr>");
  });

  it("folds gap directly into a non-last self-wrapping child's own <td>, no extra wrapper table", () => {
    const html = renderNode(mixedGapFixture, "desktop");
    // the text's own padding.bottom (0) + gap (20) = 20 (non-zero, so written), padding.top (0)
    // stays omitted — folded into ITS OWN existing <td> style (no separate padding-top:0
    // alongside it), no new <table> introduced to carry it. The trailing divider (bare-fragment,
    // last) contributes none, same rule as any last child. (The divider's own markup separately
    // uses an unrelated "padding-top: 1px" for its hairline-thickness technique — irrelevant
    // here, hence checking the text's own exact <td> style rather than a blanket "not contain".)
    expect(html).toContain('<td style="font-size: 14px; font-style: normal; font-weight: normal; text-align: left; line-height: normal; padding-bottom: 20px;">');
    expect(html).not.toContain('<td style="padding-bottom: 20px;">');
  });

  it("applies gap spacing between two self-wrapping frame children (the common real-world case)", () => {
    const html = renderNode(twoNestedFramesWithGapFixture, "desktop");
    // the first frame's own padding.bottom (0) + gap (24) = 24 (non-zero, so written); every
    // other side is zero and stays omitted — folded into its own longhand padding-bottom
    // declaration, not a standalone extra table/td.
    expect(html).toContain('<td align="center" style="padding-bottom: 24px; margin: 0; width: 100%;">');
  });

  it("skips the gap-carrying wrapper entirely for a self-wrapping child when there's no gap to carry", () => {
    // fast path: frameWithButtonChildFixture has no `gap` set at all — the button's own <tr>
    // must be appended as-is, no extra wrapping <table> introduced.
    const html = renderNode(frameWithButtonChildFixture, "desktop");
    expect(html).toContain(renderButton(buttonFixture));
  });
});

describe("renderNode — node.name comments", () => {
  it("wraps a named node's output in <!-- Name --> ... <!-- Name end -->, each on its own line", () => {
    const html = renderNode(namedFrameFixture, "desktop");
    // leading/trailing `\n` (2026-08-17) so the comment never glues onto whatever markup a
    // parent places immediately before/after it — see wrapNameComment in cssUtils.ts.
    expect(html.startsWith("\n<!-- TestBlock -->\n")).toBe(true);
    expect(html.endsWith("\n<!-- TestBlock end -->\n")).toBe(true);
  });

  it("does not add any comment when node.name is unset", () => {
    const html = renderNode(spacerFixture, "desktop");
    expect(html).not.toContain("<!--");
  });

  it("wraps a nested named child independently of its unnamed parent", () => {
    const html = renderNode(frameWithNamedChildFixture, "desktop");
    expect(html).toContain("<!-- InnerItem -->");
    expect(html).toContain("<!-- InnerItem end -->");
    // the outer frame itself has no `name`, so no comment wraps the whole thing
    expect(html.startsWith("<!--")).toBe(false);
  });

  it("does not double-wrap a promoCopy node's own fixed comment even when name is set", () => {
    const html = renderNode(namedPromoCopyFixture, "desktop");
    expect(html).toContain("<!--=== PROMO-COPY ===-->");
    expect(html).not.toContain("<!-- PromoBlock -->");
  });
});

describe("renderDocumentContent", () => {
  it("wraps a named self-wrapping top-level node's <tr> directly in Name/Name-end comments, each on its own line", () => {
    const html = renderDocumentContent([namedImageFixture], "desktop");
    expect(html.startsWith("\n<!-- Header -->\n")).toBe(true);
    expect(html.endsWith("\n<!-- Header end -->\n")).toBe(true);
  });

  it("places a named bare-fragment top-level node's comment inside the wrapping <td>, on its own line", () => {
    const html = renderDocumentContent([namedDividerFixture], "desktop");
    expect(html).toContain('<tr><td style="margin: 0; padding: 0;">\n<!-- Divider -->\n');
    expect(html).toContain("\n<!-- Divider end -->\n</td></tr>");
  });

  it("wraps each top-level node in its own <tr><td> row", () => {
    const html = renderDocumentContent([spacerFixture, imageFixture], "desktop");
    expect(html).toMatchSnapshot();
  });

  it("does not add an extra <tr><td> around a self-wrapping top-level node", () => {
    const html = renderDocumentContent([imageFixture], "desktop");
    expect(html).not.toContain("<td><tr>");
    expect(html).toBe(renderNode(imageFixture, "desktop"));
  });

  it("drops nodes hidden on the current viewport instead of emitting empty rows", () => {
    const hidden: DesignNode = { ...spacerFixture, visibility: "mobileOnly" };
    const html = renderDocumentContent([hidden], "desktop");
    expect(html).toBe("");
  });

  it("renders an empty string for an empty node list", () => {
    expect(renderDocumentContent([], "desktop")).toBe("");
  });
});

// These fixtures are TS literals annotated as DesignNode — TypeScript can accept a value zod
// would reject (e.g. a gradient stop's `position` outside [0,1]), so a fixture that renders
// fine today could silently violate the actual runtime contract. This guards against that
// drifting unnoticed: every fixture above must also parse cleanly through designFileSchema.
const ALL_FIXTURES: Array<[string, DesignNode]> = [
  ["sponsoredNote", sponsoredNote],
  ["imageFixture", imageFixture],
  ["fixedIconImageFixture", fixedIconImageFixture],
  ["spacerFixture", spacerFixture],
  ["buttonFixture", buttonFixture],
  ["outlineButtonFixture", outlineButtonFixture],
  ["iconButtonFixture", iconButtonFixture],
  ["dividerFixture", dividerFixture],
  ["dividerLogoFixture", dividerLogoFixture],
  ["headerImageFixture", headerImageFixture],
  ["verticalFrameWithGap", verticalFrameWithGap],
  ["rowFrameWithGap", rowFrameWithGap],
  ["frameWithBorderNoRadius", frameWithBorderNoRadius],
  ["frameWithRadiusAndShadow", frameWithRadiusAndShadow],
  ["thickDividerFixture", thickDividerFixture],
  ["thickDividerLogoFixture", thickDividerLogoFixture],
  ["headerImageNoHrefFixture", headerImageNoHrefFixture],
  ["uppercaseButtonFixture", uppercaseButtonFixture],
  ["perCornerRadiusButtonFixture", perCornerRadiusButtonFixture],
  ["imageNoHrefFixture", imageNoHrefFixture],
  ["styledTextFixture", styledTextFixture],
  ["rowWithSelfWrappingChildFixture", rowWithSelfWrappingChildFixture],
  ["frameWithDividerChildFixture", frameWithDividerChildFixture],
  ["frameWithButtonChildFixture", frameWithButtonChildFixture],
  ["mixedGapFixture", mixedGapFixture],
  ["twoNestedFramesWithGapFixture", twoNestedFramesWithGapFixture],
  ["rowNodeFixture", rowNodeFixture],
  ["buttonRowNodeFixture", buttonRowNodeFixture],
  ["namedFrameFixture", namedFrameFixture],
  ["frameWithNamedChildFixture", frameWithNamedChildFixture],
  ["namedPromoCopyFixture", namedPromoCopyFixture],
  ["namedImageFixture", namedImageFixture],
  ["namedDividerFixture", namedDividerFixture],
  ["cardListFixture", cardListFixture],
];

describe("designFileSchema consistency", () => {
  it.each(ALL_FIXTURES)("fixture %s parses cleanly through designFileSchema", (_name, fixture) => {
    const result = designFileSchema.safeParse([fixture]);
    expect(result.success).toBe(true);
  });
});
