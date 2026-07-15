import { normalize } from "../normalize";

function getStyle(body: HTMLBodyElement, selector: string): string {
  return body.querySelector(selector)?.getAttribute("style") ?? "";
}

describe("normalize", () => {
  it("returns an HTMLBodyElement", () => {
    const body = normalize("<p>hello</p>");
    expect(body.tagName).toBe("BODY");
  });

  // ── Always-stripped properties ─────────────────────────────────────────────

  it("strips font-family", () => {
    const body = normalize('<p style="font-family: Arial; color: red;">hi</p>');
    expect(getStyle(body, "p")).not.toContain("font-family");
    expect(getStyle(body, "p")).toContain("color");
  });

  it("strips margin shorthand and margin-right, keeps margin-top/bottom (pairwise zero-gap signal) and margin-left (accentPadX fallback)", () => {
    // margin-top/margin-bottom survive — fromDom reads them ONLY to detect the explicit
    // 0+0 pair across a paragraph boundary (single-<br> merge); values are never rendered.
    // margin-left survives too — fromDom's accentPadX fallback (CalloutLeftProps.accentPadX)
    // reads it when a border-left <p> declares no padding-left of its own.
    const body = normalize(
      '<p style="margin: 0; margin-top: 4pt; margin-bottom: 4pt; margin-left: 1pt; margin-right: 2pt; color: red;">hi</p>',
    );
    const style = getStyle(body, "p");
    expect(style).not.toContain("margin: 0");
    expect(style).not.toContain("margin-right");
    expect(style).toContain("margin-top");
    expect(style).toContain("margin-bottom");
    expect(style).toContain("margin-left");
    expect(style).toContain("color");
  });

  it("strips padding-top/right/bottom, keeps padding/padding-left (border-left <p>'s accent gap)", () => {
    // padding / padding-left survive — fromDom reads the LEFT value ONLY, as the gap
    // between a <p>'s own border-left and its text (CalloutLeftProps.accentPadX).
    const body = normalize('<p style="padding: 10px; padding-left: 5px; padding-top: 1px; padding-right: 2px; padding-bottom: 3px; color: blue;">hi</p>');
    const style = getStyle(body, "p");
    expect(style).not.toContain("padding-top");
    expect(style).not.toContain("padding-right");
    expect(style).not.toContain("padding-bottom");
    expect(style).toContain("padding:");
    expect(style).toContain("padding-left");
    expect(style).toContain("color");
  });

  it("strips white-space", () => {
    const body = normalize('<p style="white-space: nowrap; color: red;">hi</p>');
    const style = getStyle(body, "p");
    expect(style).not.toContain("white-space");
    expect(style).toContain("color");
  });

  it("strips border-collapse but keeps border (needed for classification/color)", () => {
    const body = normalize('<p style="border: 1px solid red; border-collapse: collapse; color: red;">hi</p>');
    const style = getStyle(body, "p");
    expect(style).not.toContain("border-collapse");
    expect(style).toContain("border: 1px solid red");
    expect(style).toContain("color");
  });

  it("strips border:none", () => {
    const body = normalize('<p style="border: none; color: red;">hi</p>');
    const style = getStyle(body, "p");
    expect(style).not.toContain("border");
    expect(style).toContain("color");
  });

  // ── Strip-when-value properties ────────────────────────────────────────────

  it("strips background-color:transparent but preserves a real bg color", () => {
    const body = normalize(
      '<p style="background-color: transparent;">a</p>' +
      '<p style="background-color: #f5f5f5;">b</p>',
    );
    const [p1, p2] = Array.from(body.querySelectorAll("p"));
    expect(p1.getAttribute("style") ?? "").not.toContain("background-color");
    expect(p2.getAttribute("style") ?? "").toContain("background-color");
  });

  it("preserves font-weight:normal, :400, and :700 — all three survive as spans", () => {
    const body = normalize(
      '<p>' +
      '<span style="font-weight: normal;">a</span>' +
      '<span style="font-weight: 400;">b</span>' +
      '<span style="font-weight: 700;">c</span>' +
      '</p>',
    );
    const spans = Array.from(body.querySelectorAll("span"));
    expect(spans).toHaveLength(3);
    expect(spans[2].getAttribute("style")).toContain("font-weight");
  });

  it("preserves text-decoration:none and :underline — both survive", () => {
    // text-decoration:none must survive normalize so fromDom's isExplicitNonUnderline()
    // can see an author explicitly cancelling an inherited underline on a nested span.
    const body = normalize(
      '<p>' +
      '<span style="text-decoration: none;">a</span>' +
      '<span style="text-decoration: underline;">b</span>' +
      '</p>',
    );
    const spans = Array.from(body.querySelectorAll("span"));
    expect(spans).toHaveLength(2);
    expect(spans[0].getAttribute("style")).toContain("none");
    expect(spans[1].getAttribute("style")).toContain("underline");
  });

  it("preserves font-style:normal and :italic — both survive", () => {
    const body = normalize(
      '<p>' +
      '<span style="font-style: normal;">a</span>' +
      '<span style="font-style: italic;">b</span>' +
      '</p>',
    );
    const spans = Array.from(body.querySelectorAll("span"));
    expect(spans).toHaveLength(2);
    expect(spans[1].getAttribute("style")).toContain("italic");
  });

  // ── Preserved properties ───────────────────────────────────────────────────

  it("preserves color", () => {
    const body = normalize('<span style="color: #cc0000;">hi</span>');
    expect(getStyle(body, "span")).toContain("color");
  });

  it("strips font-size — text sizes come only from the size tokens (body/small/headline/cell)", () => {
    const body = normalize('<p style="font-size: 18px;">hi</p>');
    expect(body.querySelector("p")?.hasAttribute("style")).toBe(false);
  });

  it("removes style attr entirely when nothing survives stripping", () => {
    const body = normalize('<p style="font-family: Arial; margin: 0;">hi</p>');
    expect(body.querySelector("p")?.hasAttribute("style")).toBe(false);
  });

  // ── GDocs noise ────────────────────────────────────────────────────────────

  it("strips docs-internal-guid wrapper but preserves children", () => {
    const body = normalize('<b id="docs-internal-guid-abc"><p>content</p></b>');
    expect(body.querySelector("b[id]")).toBeNull();
    expect(body.querySelector("p")?.textContent).toBe("content");
  });

  it("removes bare span wrappers without style or class", () => {
    const body = normalize('<p><span>bare</span> text</p>');
    // span has no style/class → unwrapped; text still present
    expect(body.querySelector("span")).toBeNull();
    expect(body.querySelector("p")?.textContent).toContain("bare");
  });

  it("preserves span with style", () => {
    const body = normalize('<p><span style="color: red;">styled</span></p>');
    expect(body.querySelector("span")).not.toBeNull();
  });

  it("removes <style> and <script> tags", () => {
    const body = normalize("<style>body{}</style><script>alert(1)</script><p>hi</p>");
    expect(body.querySelector("style")).toBeNull();
    expect(body.querySelector("script")).toBeNull();
    expect(body.querySelector("p")).not.toBeNull();
  });

  it("removes dir attribute", () => {
    const body = normalize('<p dir="ltr">hi</p>');
    expect(body.querySelector("p")?.hasAttribute("dir")).toBe(false);
  });
});

// A § marker becomes <br data-one-br="1"> before normalize() runs (see preprocess.ts).
// Regression coverage for the bug where cleanBrNoise silently discarded it.
describe("normalize — § marker (<br data-one-br>) survival", () => {
  it("keeps a trailing one-br marker at the end of a <p> (its only meaningful position)", () => {
    const body = normalize('<p>First paragraph<br data-one-br="1"></p><p>Second paragraph</p>');
    const marker = body.querySelector("p br[data-one-br]");
    expect(marker).not.toBeNull();
    expect(marker?.parentElement?.tagName).toBe("P");
  });

  it("keeps a leading one-br marker at the start of a <p>", () => {
    const body = normalize('<p>First paragraph</p><p><br data-one-br="1">Second paragraph</p>');
    expect(body.querySelectorAll("br[data-one-br]")).toHaveLength(1);
  });

  it("still strips a genuine unmarked leading/trailing GDocs artifact <br>", () => {
    const body = normalize("<p><br>Real content</p>");
    expect(body.querySelector("p br")).toBeNull();
  });

  it("collapses a plain <br> that sits across a span boundary from the marker (GDocs run split)", () => {
    // "text</span><br><span>§text" — the marker ends up one level deeper than the
    // plain <br> it's meant to replace; both must not survive as two breaks.
    const body = normalize('<p><span>Line one</span><br><span><br data-one-br="1">Line two</span></p>');
    const brs = body.querySelectorAll("p br");
    expect(brs).toHaveLength(1);
    expect(brs[0].hasAttribute("data-one-br")).toBe(true);
  });

  it("collapses a plain <br> that follows the marker's span (reverse order)", () => {
    const body = normalize('<p><span>Line one<br data-one-br="1"></span><br><span>Line two</span></p>');
    const brs = body.querySelectorAll("p br");
    expect(brs).toHaveLength(1);
    expect(brs[0].hasAttribute("data-one-br")).toBe(true);
  });

  it("does not touch an unrelated plain <br> elsewhere in the same paragraph", () => {
    const body = normalize('<p>A<br>B<span><br data-one-br="1">C</span></p>');
    const brs = body.querySelectorAll("p br");
    expect(brs).toHaveLength(2);
  });
});
