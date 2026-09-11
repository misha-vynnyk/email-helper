/**
 * Cosmetic, final-stage HTML re-indentation for downloaded files — purely for
 * readability when a human opens the exported .html afterwards. Must never
 * change how the markup renders.
 *
 * htmlWhitespaceSensitivity: "ignore" was checked against this app's actual
 * template shape — a block tag directly followed by an
 * `<!--[if mso | IE]-->` conditional comment with zero separating
 * whitespace, which `fullStructure` templates use throughout. "strict" was
 * tried first and rejected: it looks safest on paper (reproduces
 * whitespace-or-no-whitespace at every tag boundary via a `>`-on-next-line
 * trick instead of reflowing it), but on that exact input it injects a
 * duplicated `>` byte right after the opening tag (`<div ...>` + a bare `>`
 * before the comment) — genuine output corruption, not just a whitespace
 * difference. "ignore" does not exhibit that on the same input — see
 * prettyPrintHtml.test.ts for the regression case.
 *
 * Both this app's ".html" and ".mjml" exports are plain HTML with different
 * table templates under the hood (there's no real <mjml>/<mj-*> markup
 * anywhere), so a single "html" parser call handles both.
 *
 * Loaded lazily (prettier/standalone + the html plugin are large and only
 * ever needed at download time), mirroring the memoized dynamic-import
 * pattern used for tesseract.js in ../utils/ocr/engine.ts.
 */
let prettierModulesPromise: Promise<{
  format: typeof import("prettier/standalone").format;
  htmlPlugin: typeof import("prettier/plugins/html");
}> | null = null;

function loadPrettier() {
  if (!prettierModulesPromise) {
    prettierModulesPromise = Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/html"),
    ]).then(([standalone, htmlPlugin]) => ({
      format: standalone.format,
      htmlPlugin,
    }));
  }
  return prettierModulesPromise;
}

export async function prettyPrintHtml(html: string): Promise<string> {
  try {
    const { format, htmlPlugin } = await loadPrettier();
    let formatted = await format(html, {
      parser: "html",
      plugins: [htmlPlugin],
      printWidth: 120,
      tabWidth: 2,
      useTabs: false,
      singleAttributePerLine: false,
      bracketSameLine: true,
      htmlWhitespaceSensitivity: "ignore",
    });

    formatted = formatted.trim();
    formatted = formatted.replace(/(<[a-z0-9]+)\s+([^>]+?)\s*>/gi, (_match, tag, attrs) => {
      const cleanAttrs = attrs.replace(/\s+/g, " ").trim();
      return `${tag} ${cleanAttrs}>`;
    });

    return formatted;
  } catch (error) {
    console.error("prettyPrintHtml: Prettier formatting failed, returning original HTML", error);
    return html;
  }
}
