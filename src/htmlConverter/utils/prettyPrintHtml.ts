/**
 * Cosmetic, final-stage HTML re-indentation for downloaded files — purely for
 * readability when a human opens the exported .html afterwards. Must never
 * change how the markup renders.
 *
 * htmlWhitespaceSensitivity is left at Prettier's "css" default, NOT
 * "strict". "strict" looks safer on paper (it reproduces whitespace-or-no-
 * whitespace at every tag boundary via a `>`-on-next-line trick instead of
 * reflowing it), but live-testing it against this app's actual template
 * shape — a block tag directly followed by an `<!--[if mso | IE]-->`
 * conditional comment with zero separating whitespace, which `fullStructure`
 * templates use throughout — produces literally corrupted output: a
 * duplicated `>` byte injected right after the opening tag (`<div ...>` +
 * bare `>` before the comment), not just a whitespace difference. "css" mode
 * does not exhibit that corruption on the same input and only ever reflows
 * pre-existing significant whitespace into a newline, never invents a new
 * character — see prettyPrintHtml.test.ts for the regression case.
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
    return await format(html, {
      parser: "html",
      plugins: [htmlPlugin],
      printWidth: 120,
      tabWidth: 2,
      useTabs: false,
      bracketSameLine: true,
    });
  } catch (error) {
    console.error("prettyPrintHtml: Prettier formatting failed, returning original HTML", error);
    return html;
  }
}
