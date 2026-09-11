import { capImageWidthsInContent, replaceAltsInContent } from "../utils/contentReplacer";

const HTML_IMG_PATTERN = /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;
const MJML_PATTERN = /(<(?:mj-image|img)[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;

describe("contentReplacer", () => {
  it("should escape alt text when replacing existing alt attribute", () => {
    const input = '<img src="https://cdn.example.com/a.png" alt="old">';
    const altMap = {
      "https://cdn.example.com/a.png": 'John "J" & <Team>',
    };

    const output = replaceAltsInContent(input, altMap);

    expect(output.count).toBe(1);
    expect(output.replaced).toContain('alt="John &quot;J&quot; &amp; &lt;Team&gt;"');
  });

  it("should escape alt text when injecting missing alt attribute", () => {
    const input = '<img src="https://cdn.example.com/b.png">';
    const altMap = {
      "https://cdn.example.com/b.png": "Client's banner",
    };

    const output = replaceAltsInContent(input, altMap);

    expect(output.count).toBe(1);
    expect(output.replaced).toContain('alt="Client&#39;s banner"');
  });
});

describe("capImageWidthsInContent", () => {
  it("caps the width attribute and max-width style down to the real image width", () => {
    const html = '<img src="https://cdn.example.com/placeholder.png" width="600" style="max-width:600px">';

    const result = capImageWidthsInContent(html, HTML_IMG_PATTERN, [234]);

    expect(result.count).toBe(1);
    expect(result.replaced).toContain('width="230"');
    expect(result.replaced).toContain("max-width:230px");
  });

  it("leaves the tag untouched when the real width is unknown (a hole in the widths array)", () => {
    const html = '<img src="https://cdn.example.com/placeholder.png" width="600">';

    const result = capImageWidthsInContent(html, HTML_IMG_PATTERN, [undefined]);

    expect(result.count).toBe(0);
    expect(result.replaced).toBe(html);
  });

  it("leaves the tag untouched when the real width is >= the declared width (no upscale risk)", () => {
    const html = '<img src="https://cdn.example.com/placeholder.png" width="400">';

    const result = capImageWidthsInContent(html, HTML_IMG_PATTERN, [500]);

    expect(result.count).toBe(0);
    expect(result.replaced).toBe(html);
  });

  it("matches images positionally, not by src, so identical placeholder srcs each get their own real width", () => {
    // Every rendered placeholder <img> shares one fixed src (see wrapImg's tok.storageUrl) —
    // capImageWidthsInContent must line images up by order of appearance, same as
    // replaceUrlsInContent's positional fallback, not by looking up that shared src.
    const html = [
      '<img src="https://cdn.example.com/placeholder.png" width="600">',
      '<img src="https://cdn.example.com/placeholder.png" width="600">',
    ].join("");

    const result = capImageWidthsInContent(html, HTML_IMG_PATTERN, [234, undefined]);

    const widths = [...result.replaced.matchAll(/width="(\d+)"/g)].map((m) => m[1]);
    expect(widths).toEqual(["230", "600"]);
    expect(result.count).toBe(1);
  });

  it("skips signature-marked images without consuming a slot in the widths array", () => {
    const html = [
      '<img src="https://cdn.example.com/placeholder.png" alt="signature" width="600">',
      '<img src="https://cdn.example.com/placeholder.png" width="600">',
    ].join("");

    const result = capImageWidthsInContent(html, HTML_IMG_PATTERN, [234]);

    const widths = [...result.replaced.matchAll(/width="(\d+)"/g)].map((m) => m[1]);
    expect(widths).toEqual(["600", "230"]);
    expect(result.count).toBe(1);
  });

  it("works with the MJML pattern (mj-image tags) and preserves a px unit suffix", () => {
    const mjml = '<mj-image src="https://cdn.example.com/placeholder.png" width="600px" css-class="x">';

    const result = capImageWidthsInContent(mjml, MJML_PATTERN, [180]);

    expect(result.count).toBe(1);
    expect(result.replaced).toContain('width="180px"');
  });

  it("regression: caps each image correctly when widths are built from a src-keyed map, same as useHtmlExport wires it", () => {
    const PLACEHOLDER = "https://storage.example.com/placeholder.png";
    const uploadedUrlMap: Record<string, string> = {
      "blob:http://localhost/img-1": "https://storage.example.com/real-1.png",
      "blob:http://localhost/img-2": "https://storage.example.com/real-2.png",
      "blob:http://localhost/img-3": "https://storage.example.com/real-3.png",
    };
    const uploadedWidthMap: Record<string, number> = {
      "blob:http://localhost/img-1": 234, // small source -> should be capped
      // img-2 has no known real width -> should NOT be capped
      "blob:http://localhost/img-3": 900, // larger than container -> should NOT be capped
    };
    const content = [
      `<img src="${PLACEHOLDER}" width="600">`,
      `<img src="${PLACEHOLDER}" width="600">`,
      `<img src="${PLACEHOLDER}" width="600">`,
    ].join("");

    const widths = Object.keys(uploadedUrlMap).map((src) => uploadedWidthMap[src]);
    const result = capImageWidthsInContent(content, HTML_IMG_PATTERN, widths);

    const widthAttrs = [...result.replaced.matchAll(/width="(\d+)"/g)].map((m) => m[1]);
    expect(widthAttrs).toEqual(["230", "600", "600"]);
    expect(result.count).toBe(1);
  });
});
