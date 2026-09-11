
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

    // Prettier's html printer always self-closes void elements ("<br />")
    // with no option to turn it off — undo that for <br> specifically.
    formatted = formatted.replace(/<br\s*\/?>/gi, "<br>");
    formatted = formatted.replace(/<br>\s+(?=<br>)/g, "<br>");

    // Prettier's html printer always isolates a mid-paragraph single <br>
    // onto its own line — this app's convention keeps it flush against the
    // surrounding text instead. A <br><br> paragraph separator is left alone
    // (kept on its own line): the negative lookahead below only matches a
    // <br> that ISN'T immediately followed by another one, so a glued
    // <br><br> pair (produced by the whitespace-collapse above) never
    // matches here.
    formatted = formatted.replace(/\n[ \t]*<br>(?!<br>)\n[ \t]*/g, "<br>");

    formatted = formatted.replace(/\s+([.,!?:;])/g, "$1");

    formatted = formatted.replace(/(<a[^>]*>)([\s\S]*?)(<\/a>)/gi, (_match, startTag, content, endTag) => {
      const cleanContent = content.replace(/\s+/g, " ").trim();
      return `${startTag}${cleanContent}${endTag}`;
    });

    return formatted;
  } catch (error) {
    console.error("prettyPrintHtml: Prettier formatting failed, returning original HTML", error);
    return html;
  }
}
