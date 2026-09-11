
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

    // Prettier's html printer always self-closes void elements ("<br />",
    // "<img ... />") with no option to turn it off — normalize back to bare
    // "<br>"/"<img ...>" to match this app's own convention.
    const VOID_ELEMENTS = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];
    const voidSelfCloseRegex = new RegExp(`(<(?:${VOID_ELEMENTS.join("|")})\\b[^>]*?)\\s*/>`, "gi");
    formatted = formatted.replace(voidSelfCloseRegex, "$1>");

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
