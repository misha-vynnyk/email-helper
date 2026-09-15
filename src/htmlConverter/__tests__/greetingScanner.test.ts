/**
 * @jest-environment jsdom
 */
import { scanGreetingPhrases } from "../utils/greetingScanner";

function createRoot(html: string): HTMLDivElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
}

describe("scanGreetingPhrases", () => {
  it("matches a plain 'Dear Reader,' opener", () => {
    const root = createRoot("<p>Dear Reader,</p><p>Some body text.</p>");
    const matches = scanGreetingPhrases(root);
    expect(matches.map((m) => m.token)).toEqual(["Dear Reader,"]);
  });

  it("matches 'Hi Bob,' case-insensitively", () => {
    const root = createRoot("<p>hi Bob, hope you're well.</p>");
    const matches = scanGreetingPhrases(root);
    expect(matches.map((m) => m.token)).toEqual(["hi Bob,"]);
  });

  it("does not match ordinary text with no greeting", () => {
    const root = createRoot("<p>The market is in turmoil today.</p>");
    expect(scanGreetingPhrases(root)).toHaveLength(0);
  });

  it("only matches at the start of a block, not mid-paragraph", () => {
    const root = createRoot("<p>Some text mentions hello, world in passing.</p>");
    expect(scanGreetingPhrases(root)).toHaveLength(0);
  });

  it("finds greetings in multiple separate blocks", () => {
    const root = createRoot("<div><p>Hello,</p><span>filler</span><p>Hey there,</p></div>");
    const matches = scanGreetingPhrases(root);
    expect(matches.map((m) => m.token)).toEqual(["Hello,", "Hey there,"]);
    expect(matches[0].node).not.toBe(matches[1].node);
  });

  it("returns offsets relative to the matched text node", () => {
    const root = createRoot("<p>Dear Reader, thanks for reading.</p>");
    const matches = scanGreetingPhrases(root);
    expect(matches[0]).toMatchObject({ startOffset: 0, endOffset: 12 });
  });
});
