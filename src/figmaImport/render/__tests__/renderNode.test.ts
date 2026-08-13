import type { DesignNode } from "../../types";
import { renderDocumentContent, renderNode } from "../renderNode";

// "SponsoredNote" fixture — frame+frame+text, no button/divider/image. Values taken
// literally from the "Sponsored Content" example in FIGMA_TEMPLATE_IMPORT_PLAN.md
// (outer frame's `padding` added — the plan's example omits it, but the schema
// requires `padding` on every FrameNode).
const sponsoredNote: DesignNode = {
  id: "sponsored-note-1",
  name: "SponsoredNote",
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
        },
      ],
    },
  ],
};

const imageFixture: DesignNode = {
  id: "hero-image",
  type: "image",
  altDescription: "Video preview of the newsletter header",
  href: "urlhere",
};

const spacerFixture: DesignNode = {
  id: "spacer-1",
  type: "spacer",
  heightPx: 24,
};

// Values taken literally from the user's own filled-in "button-no-icon" block in
// figma-to-html/content-blocks-template.html.
const buttonFixture: DesignNode = {
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

const outlineButtonFixture: DesignNode = {
  ...buttonFixture,
  id: "btn-outline",
  background: undefined,
  border: { widthPx: 1, color: "#ffffff" },
};

// Values taken literally from the user's own filled-in "button-with-icon-left/right"
// blocks in figma-to-html/content-blocks-template.html.
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
    id: "btn-unsubscribe-icon",
    type: "image",
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

describe("renderNode", () => {
  it("renders the SponsoredNote fixture", () => {
    expect(renderNode(sponsoredNote, "desktop")).toMatchSnapshot();
  });

  it("renders an image node, wrapped in a link when href is set", () => {
    expect(renderNode(imageFixture, "desktop")).toMatchSnapshot();
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
});

describe("renderDocumentContent", () => {
  it("wraps each top-level node in its own <tr><td> row", () => {
    const html = renderDocumentContent([spacerFixture, imageFixture], "desktop");
    expect(html).toMatchSnapshot();
  });

  it("drops nodes hidden on the current viewport instead of emitting empty rows", () => {
    const hidden: DesignNode = { ...spacerFixture, visibility: "mobileOnly" };
    const html = renderDocumentContent([hidden], "desktop");
    expect(html).toBe("");
  });
});
