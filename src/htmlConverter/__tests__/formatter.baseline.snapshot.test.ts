/**
 * Baseline snapshot suite — captured BEFORE the token-based dedup refactor
 * (see CONVERSION_SETTINGS_PLAN.md §6 Stage 8 and the plan at
 * /Users/mykhailovynnyk/.claude/plans/tidy-bubbling-oasis.md).
 *
 * Purpose: this is the ONLY safety net for `ttt`/`alphaone` formatter output
 * and for the MJML branch of all three profiles — none of it had any test
 * coverage before this file. Every snapshot here must stay byte-identical
 * across Stages 1-3 of the refactor, with ONE deliberate exception: the TTT
 * `wrapImg`/`rightSideImg`/`leftSideImg`/`signatureImg` snapshots currently
 * bake in a real bug (`TTT_STORAGE_URL` resolves to the literal string
 * "undefined/" because `ttt/templates.ts` reads
 * `STORAGE_PROVIDERS_CONFIG.providers.publicBaseUrl` instead of
 * `.providers.ttt.publicBaseUrl`). That bug is fixed in Stage 1 as an
 * explicitly-approved behavior change, so the TTT snapshots are expected to
 * update then — everything else in this file must not.
 */
import { formatHtmlAlphaone, formatMjmlAlphaone } from "../alphaone/formatter";
import { formatHtml, formatMjml } from "../formatter";
import { formatHtmlTTT, formatMjmlTTT } from "../ttt/formatter";

// Exercises every one of the 15 template keys shared by all three forks
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
  { name: "default", formatHtml, formatMjml },
  { name: "ttt", formatHtml: formatHtmlTTT, formatMjml: formatMjmlTTT },
  { name: "alphaone", formatHtml: formatHtmlAlphaone, formatMjml: formatMjmlAlphaone },
];

describe("simple converter baseline (pre-refactor snapshots)", () => {
  describe.each(PROFILES)("$name profile", ({ formatHtml: fmtHtml, formatMjml: fmtMjml }) => {
    it("formatHtml output", () => {
      expect(fmtHtml(FIXTURE)).toMatchSnapshot();
    });

    it("formatMjml output", () => {
      expect(fmtMjml(FIXTURE)).toMatchSnapshot();
    });
  });
});
