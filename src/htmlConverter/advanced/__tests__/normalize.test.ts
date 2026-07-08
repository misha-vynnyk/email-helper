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

  it("strips margin shorthand and margin-bottom/left/right, but keeps margin-top", () => {
    // margin-top survives — fromDom reads it as the adjacent-paragraph merge signal (§4).
    const body = normalize(
      '<p style="margin: 0; margin-top: 4pt; margin-bottom: 4pt; margin-left: 1pt; color: red;">hi</p>',
    );
    const style = getStyle(body, "p");
    expect(style).not.toContain("margin-bottom");
    expect(style).not.toContain("margin-left");
    expect(style).toContain("margin-top");
    expect(style).toContain("color");
  });

  it("strips padding variants", () => {
    const body = normalize('<p style="padding: 10px; padding-left: 5px; color: blue;">hi</p>');
    const style = getStyle(body, "p");
    expect(style).not.toContain("padding");
    expect(style).toContain("color");
  });

  it("strips white-space", () => {
    const body = normalize('<p style="white-space: nowrap; font-size: 14px;">hi</p>');
    const style = getStyle(body, "p");
    expect(style).not.toContain("white-space");
    expect(style).toContain("font-size");
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

  it("strips text-decoration:none but preserves underline", () => {
    const body = normalize(
      '<p>' +
      '<span style="text-decoration: none;">a</span>' +
      '<span style="text-decoration: underline;">b</span>' +
      '</p>',
    );
    // none → style stripped → bare span removed; only underline span survives
    const spans = Array.from(body.querySelectorAll("span"));
    expect(spans).toHaveLength(1);
    expect(spans[0].getAttribute("style")).toContain("underline");
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

  it("preserves font-size", () => {
    const body = normalize('<p style="font-size: 18px;">hi</p>');
    expect(getStyle(body, "p")).toContain("font-size");
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
