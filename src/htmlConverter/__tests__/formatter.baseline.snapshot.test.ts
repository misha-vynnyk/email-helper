/**
 * Regression snapshot suite for `simple/formatter.ts` across profiles.
 *
 * Originally captured the pre-refactor legacy per-profile forks (root
 * `formatter.ts`, `ttt/formatter.ts`, `alphaone/formatter.ts`) to verify the
 * token-based `simple/` rewrite (CONVERSION_SETTINGS_PLAN.md §6 Stage 8,
 * plan at ~/.claude/plans/tidy-bubbling-oasis.md) didn't change behavior.
 * That verification is long done and the legacy forks have since been
 * deleted (dead code, superseded by `simple/`) — this file now snapshots
 * `simple/`'s own output directly, so it still catches accidental output
 * changes in the live converter across profiles.
 */
import { formatHtmlAlphaone, formatHtmlDefault, formatHtmlRed, formatHtmlTTT, formatMjmlAlphaone, formatMjmlDefault, formatMjmlRed, formatMjmlTTT } from "../testHelpers/simpleFormatHtml";

// Exercises every one of the 15 template keys shared by all profiles
// (headline/centerHeadline, quote/centerQuote, button, smallText/smallCenterText,
// centerText, rightSideImg, leftSideImg, footerBlock/footerCenterBlock,
// signatureImg, wrapImg, fullStructure), plus the native-italic-link case
// (default-only `<em>` wrapping) and the blue-text-to-link auto-conversion.
const FIXTURE = `
<h1>Headline Title</h1>
<h1 style="text-align: center">Centered Headline</h1>
<h4>Quote text here</h4>
<h4 style="text-align: center">Centered quote text</h4>
<h5>Click Me Button</h5>
<h6>Small print text</h6>
<h6 style="text-align: center">Centered small text</h6>
<p style="text-align: center">Centered paragraph text</p>
<p>Regular paragraph with <a href="https://example.com"><span style="font-style: italic;">italic native link</span></a> inside.</p>
<p><span style="color: rgb(17,85,204);">Blue auto-link text</span></p>
<p>Line before break§Line after break</p>
<img src="https://example.com/image.jpg" alt="test image">
i-r-sRight side image texti-r-s-e
i-l-sLeft side image texti-l-s-e
sign-iSignature blocksign-i-e
ftr-sFooter contentftr-e
ftr-cCentered footer contentftr-c-e
`;

const PROFILES = [
  { name: "default", formatHtml: formatHtmlDefault, formatMjml: formatMjmlDefault },
  { name: "ttt", formatHtml: formatHtmlTTT, formatMjml: formatMjmlTTT },
  { name: "alphaone", formatHtml: formatHtmlAlphaone, formatMjml: formatMjmlAlphaone },
  { name: "red", formatHtml: formatHtmlRed, formatMjml: formatMjmlRed },
];

describe("simple converter output snapshots", () => {
  describe.each(PROFILES)("$name profile", ({ formatHtml: fmtHtml, formatMjml: fmtMjml }) => {
    it("formatHtml output", () => {
      expect(fmtHtml(FIXTURE)).toMatchSnapshot();
    });

    it("formatMjml output", () => {
      expect(fmtMjml(FIXTURE)).toMatchSnapshot();
    });
  });
});
