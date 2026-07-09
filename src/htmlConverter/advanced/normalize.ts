// Phase 2: strip GDocs-specific noise before IR construction.
// Uses DOMParser so we handle nested structures correctly.

const ALWAYS_STRIP = new Set([
  "white-space", "vertical-align", "font-variant",
  "overflow", "overflow-wrap",
  "font-family", "line-height",
  "margin", "margin-bottom", "margin-left", "margin-right",
  "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
  "border-collapse", "border-spacing",
]);
// margin-top is kept (not stripped) — fromDom reads it as a signal for adjacent-paragraph
// merging (§4): margin-top:0 is GDocs' explicit "no space before this paragraph" marker.
// border / border-top / border-bottom / border-left / border-right are kept —
// fromDom reads their color for classification (§4) and box rendering; GDocs
// widths are still ignored at render time (house tokens control px).

const STRIP_WHEN: Array<[string, string]> = [
  ["background-color", "transparent"],
  ["border", "none"],
];
// text-decoration: none is kept even when explicit — fromDom's isExplicitNonUnderline()
// reads it to detect an author cancelling an inherited underline on a nested span.

function cleanStyle(style: string): string {
  const kept: string[] = [];
  for (const decl of style.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val  = decl.slice(idx + 1).trim().toLowerCase();
    if (!prop || !val) continue;
    if (ALWAYS_STRIP.has(prop)) continue;
    if (STRIP_WHEN.some(([p, v]) => p === prop && val === v)) continue;
    kept.push(`${prop}: ${val}`);
  }
  return kept.join("; ");
}

function cleanEl(el: Element): void {
  el.removeAttribute("dir");

  const style = el.getAttribute("style");
  if (style !== null) {
    const cleaned = cleanStyle(style);
    if (cleaned) {
      el.setAttribute("style", cleaned);
    } else {
      el.removeAttribute("style");
    }
  }

  for (const child of Array.from(el.children)) {
    cleanEl(child);
  }
}

function cleanBrNoise(body: HTMLElement): void {
  // Strip leading/trailing <br> from block elements (GDocs artifact: <p><br>text</p>).
  // Without this, parseParagraph produces a leading empty line that shifts paraBreak indices.
  body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li").forEach(el => {
    while (el.firstChild?.nodeName === "BR") el.firstChild.remove();
    while (el.lastChild?.nodeName === "BR") el.lastChild.remove();
  });

  // Unwrap <span> elements that contain only <br> tags (and optional whitespace text).
  // e.g. <span><br></span> → <br>  so the parent block's boundary cleanup above can catch it.
  body.querySelectorAll("span").forEach(span => {
    const nodes = Array.from(span.childNodes);
    if (nodes.length > 0 && nodes.every(
      n => n.nodeName === "BR" ||
           (n.nodeType === Node.TEXT_NODE && !(n.textContent?.trim()))
    )) {
      span.replaceWith(...Array.from(span.childNodes));
    }
  });
}

export function normalize(rawHtml: string): HTMLBodyElement {
  const doc = new DOMParser().parseFromString(`<body>${rawHtml}</body>`, "text/html");
  const body = doc.body;

  body.querySelectorAll("meta, style, script").forEach(el => el.remove());

  body.querySelectorAll('b[id^="docs-internal-guid"]').forEach(el => {
    el.replaceWith(...Array.from(el.childNodes));
  });

  cleanEl(body);

  body.querySelectorAll("span:not([style]):not([class])").forEach(span => {
    span.replaceWith(...Array.from(span.childNodes));
  });

  cleanBrNoise(body);

  return body as HTMLBodyElement;
}
