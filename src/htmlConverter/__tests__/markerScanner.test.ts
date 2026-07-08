/**
 * @jest-environment jsdom
 */
import { getHighlightTokens } from "../markers";
import { scanMarkerTokens } from "../utils/markerScanner";

function createRoot(html: string): HTMLDivElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

const TOKENS = getHighlightTokens("§");

describe("scanMarkerTokens", () => {
  it("розрізняє i-r-s та i-r-s-e (довший токен перемагає)", () => {
    const root = createRoot("<p>i-r-s</p><p>text</p><p>i-r-s-e</p>");
    const matches = scanMarkerTokens(root, TOKENS);
    expect(matches.map((m) => m.token)).toEqual(["i-r-s", "i-r-s-e"]);
  });

  it("розрізняє ftr-c та ftr-c-e в одній ноді", () => {
    const root = createRoot("<p>ftr-c hello ftr-c-e</p>");
    const matches = scanMarkerTokens(root, TOKENS);
    expect(matches.map((m) => m.token)).toEqual(["ftr-c", "ftr-c-e"]);
    expect(matches[0]).toMatchObject({ startOffset: 0, endOffset: 5 });
    expect(matches[1]).toMatchObject({ startOffset: 12, endOffset: 19 });
  });

  it("не матчить токени всередині слів", () => {
    const root = createRoot("<p>xftr-s ftr-sx sign-in</p>");
    expect(scanMarkerTokens(root, TOKENS)).toHaveLength(0);
  });

  it("матчить § навіть впритул до тексту", () => {
    const root = createRoot("<p>hello§world</p>");
    const matches = scanMarkerTokens(root, TOKENS);
    expect(matches.map((m) => m.token)).toEqual(["§"]);
    expect(matches[0]).toMatchObject({ startOffset: 5, endOffset: 6 });
  });

  it("працює з кастомним багатосимвольним oneBrSymbol", () => {
    const root = createRoot("<p>line ~~ next</p>");
    const matches = scanMarkerTokens(root, getHighlightTokens("~~"));
    expect(matches.map((m) => m.token)).toEqual(["~~"]);
  });

  it("знаходить токени в кількох текстових нодах", () => {
    const root = createRoot("<div><p>sign-i</p><span>text</span><b>sign-i-e</b></div>");
    const matches = scanMarkerTokens(root, TOKENS);
    expect(matches.map((m) => m.token)).toEqual(["sign-i", "sign-i-e"]);
    expect(matches[0].node).not.toBe(matches[1].node);
  });

  it("матчить незалежно від регістру (форматер теж case-insensitive)", () => {
    const root = createRoot("<p>FTR-S text FTR-E</p>");
    expect(scanMarkerTokens(root, TOKENS).map((m) => m.token)).toEqual(["FTR-S", "FTR-E"]);
  });

  it("порожній список токенів → порожній результат", () => {
    const root = createRoot("<p>i-r-s</p>");
    expect(scanMarkerTokens(root, [])).toEqual([]);
  });
});
