import { profile as alphaoneProfile } from "../../profiles/alphaone";
import { profile as redProfile } from "../../profiles/red";
import { profile as tttProfile } from "../../profiles/ttt";
import { buildSimpleTemplates } from "../templates";
import { mergeSimpleTokens, tokens } from "../tokens";

const defaultTemplates = buildSimpleTemplates(tokens);
const tttTokens = mergeSimpleTokens(tokens, tttProfile);
const tttTemplates = buildSimpleTemplates(tttTokens);
const alphaoneTokens = mergeSimpleTokens(tokens, alphaoneProfile);
const alphaoneTemplates = buildSimpleTemplates(alphaoneTokens);
const redTokens = mergeSimpleTokens(tokens, redProfile);
const redTemplates = buildSimpleTemplates(redTokens);

describe("buildSimpleTemplates — token substitution per key", () => {
  describe("button", () => {
    it("HTML: substitutes height/className/padding/color/href per profile", () => {
      const out = defaultTemplates.htmlTemplates.button("Click");
      expect(out).toContain('class="btn-edit-p"');
      expect(out).toContain('height="51"');
      expect(out).toContain("background-color: #28b628");
      expect(out).toContain('href="urlhere"');

      const tttOut = tttTemplates.htmlTemplates.button("Click");
      expect(tttOut).toContain('class="creative-button"');

      const alphaoneOut = alphaoneTemplates.htmlTemplates.button("Click");
      expect(alphaoneOut).toContain('class="custom-button"');
      expect(alphaoneOut).toContain('height="53"');
      expect(alphaoneOut).toContain("background-color: #25b625");
      expect(alphaoneOut).toContain("padding: 3px 4px");
      expect(alphaoneOut).toContain("padding: 10px 20px");
    });

    it("radius: shared 10px for default/ttt/alphaone, 12px for Red", () => {
      expect(defaultTemplates.htmlTemplates.button("Click")).toContain("border-radius: 10px");
      expect(tttTemplates.htmlTemplates.button("Click")).toContain("border-radius: 10px");
      expect(alphaoneTemplates.htmlTemplates.button("Click")).toContain("border-radius: 10px");
      const redOut = redTemplates.htmlTemplates.button("Click");
      expect(redOut).toContain("border-radius: 12px");
      expect(redOut).toContain('class="base-button"');
      expect(redOut).toContain("background-color: #29c329");
    });
  });

  describe("headline / centerHeadline", () => {
    it("uses headlineWrapTag and headlineFontSize per profile", () => {
      expect(defaultTemplates.htmlTemplates.headline("Title")).toContain("<strong");
      expect(defaultTemplates.htmlTemplates.headline("Title")).toContain("font-size:22px");

      expect(tttTemplates.htmlTemplates.headline("Title")).toContain("<b ");

      expect(alphaoneTemplates.htmlTemplates.centerHeadline("Title")).toContain("<b ");
      expect(alphaoneTemplates.htmlTemplates.centerHeadline("Title")).toContain("font-size:24px");
    });
  });

  describe("footerBlock / footerCenterBlock", () => {
    it("uses footerPaddingTopHtml per profile", () => {
      expect(defaultTemplates.htmlTemplates.footerBlock("Footer")).toContain("padding-top: 34px");
      expect(tttTemplates.htmlTemplates.footerCenterBlock("Footer")).toContain("padding-top: 25px");
      expect(alphaoneTemplates.htmlTemplates.footerBlock("Footer")).toContain("padding-top: 25px");
    });

    it("Red: footerPaddingBottomHtml (15px) is distinct from its own 16px blockPaddingV", () => {
      const out = redTemplates.htmlTemplates.footerBlock("Footer");
      expect(out).toContain("padding-top: 25px");
      expect(out).toContain("padding-bottom: 15px");
    });
  });

  describe("signatureImg", () => {
    it("HTML uses signature.widthHtml/className; MJML uses signature.widthMjml (can differ from HTML width)", () => {
      const defaultHtml = defaultTemplates.htmlTemplates.signatureImg("");
      expect(defaultHtml).toContain('width="200"');
      expect(defaultHtml).toContain('class="img-bg-block"');

      const defaultMjml = defaultTemplates.mjmlTemplates.signatureImg("");
      expect(defaultMjml).toContain('width="180"');
      expect(defaultMjml).toContain("width:180px;");

      const tttHtml = tttTemplates.htmlTemplates.signatureImg("");
      expect(tttHtml).toContain('width="220"');
      const tttMjml = tttTemplates.mjmlTemplates.signatureImg("");
      expect(tttMjml).toContain('width="220"');

      const alphaoneHtml = alphaoneTemplates.htmlTemplates.signatureImg("");
      expect(alphaoneHtml).toContain('class="image-block"');
      expect(alphaoneHtml).toContain('width="220"');
    });

    it("HTML max-width: default is a fixed 100% (NOT tied to its own width); ttt/alphaone both match their own widthHtml", () => {
      expect(defaultTemplates.htmlTemplates.signatureImg("")).toContain("max-width: 100%;");
      expect(tttTemplates.htmlTemplates.signatureImg("")).toContain("max-width: 220px;");
      expect(alphaoneTemplates.htmlTemplates.signatureImg("")).toContain("max-width: 220px;");
    });
  });

  describe("wrapImg", () => {
    it("HTML uses wrapImg.widthHtml/className per profile; MJML width is shared (550) for default/ttt but AlfaOne matches its own HTML width (562)", () => {
      expect(defaultTemplates.htmlTemplates.wrapImg("")).toContain('width="560"');
      expect(tttTemplates.htmlTemplates.wrapImg("")).toContain('width="400"');
      const alphaoneHtml = alphaoneTemplates.htmlTemplates.wrapImg("");
      expect(alphaoneHtml).toContain('width="562"');
      expect(alphaoneHtml).toContain('class="image-full-wrapper"');

      expect(defaultTemplates.mjmlTemplates.wrapImg("")).toContain('width="550"');
      expect(tttTemplates.mjmlTemplates.wrapImg("")).toContain('width="550"');
      expect(alphaoneTemplates.mjmlTemplates.wrapImg("")).toContain('width="562"');
    });
  });

  describe("rightSideImg / leftSideImg", () => {
    it("uses storageUrl and blockPaddingV for padding in the common case", () => {
      const defaultOut = defaultTemplates.htmlTemplates.rightSideImg("text");
      expect(defaultOut).toContain(`src="${tokens.storageUrl}"`);
      expect(defaultOut).toContain("padding-bottom: 14px; padding-top: 14px;");

      const tttLeftOut = tttTemplates.htmlTemplates.leftSideImg("text");
      expect(tttLeftOut).toContain("padding-bottom: 15px; padding-top: 15px;");
      expect(tttLeftOut).toContain(`src="${tttTokens.storageUrl}"`);
    });

    it("AlfaOne HTML rightSideImg uses the quirky rightSideImgHtmlPaddingV (15px), distinct from its own 16px blockPaddingV — leftSideImg and both MJML rows are unaffected", () => {
      const rightOut = alphaoneTemplates.htmlTemplates.rightSideImg("text");
      expect(rightOut).toContain("padding-bottom: 15px; padding-top: 15px;");

      const leftOut = alphaoneTemplates.htmlTemplates.leftSideImg("text");
      expect(leftOut).toContain("padding-bottom: 16px; padding-top: 16px;");

      const mjmlRightOut = alphaoneTemplates.mjmlTemplates.rightSideImg("text");
      expect(mjmlRightOut).toContain("padding-bottom: 16px; padding-top: 16px;");
    });

    it("wraps the body text in blockWrapTag (span for default, div for ttt/alphaone) in both HTML and MJML", () => {
      expect(defaultTemplates.htmlTemplates.rightSideImg("text")).toContain("<span");
      expect(defaultTemplates.mjmlTemplates.rightSideImg("text")).toContain("<span");

      expect(tttTemplates.htmlTemplates.leftSideImg("text")).toContain("<div");
      expect(tttTemplates.mjmlTemplates.leftSideImg("text")).toContain("<div");
    });
  });

  describe("fullStructure", () => {
    it("default/ttt: has dedicated spacer <tr> rows with tok-driven height/className", () => {
      const out = defaultTemplates.htmlTemplates.fullStructure("<tr><td>content</td></tr>");
      expect(out).toContain('height="16"');
      expect(out).toContain('class="md-horizontal-space"');
      expect(out).toContain('class="primary-table-limit content-table"');

      const tttOut = tttTemplates.htmlTemplates.fullStructure("<tr><td>content</td></tr>");
      expect(tttOut).toContain('height="15"');
      expect(tttOut).toContain('class="space-between-sections"');
      expect(tttOut).toContain('class="main-table"');
      expect(tttOut).toContain("padding-left: 21px; padding-right: 21px;");
    });

    it("alphaone: has NO spacer <tr> rows, and bakes vertical padding onto the content td instead", () => {
      const out = alphaoneTemplates.htmlTemplates.fullStructure("<tr><td>content</td></tr>");
      expect(out).not.toContain("md-horizontal-space");
      expect(out).not.toContain("space-between-sections");
      expect(out).toContain('class="primary-table-wrapper"');
      expect(out).toContain('class="content-space-main-wrapper"');
      expect(out).toContain("padding-top: 14px; padding-left: 19px; padding-bottom: 14px; padding-right: 19px;");
    });
  });
});
