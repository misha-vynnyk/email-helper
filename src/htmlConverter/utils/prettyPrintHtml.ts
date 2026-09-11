
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

    // Prettier's html printer always isolates <br> onto its own line, whether
    // it's a mid-paragraph single break or a <br><br> paragraph separator —
    // this app's own templates never do that (a <br>/<br><br> run always sits
    // glued to whatever text/tags surround it). Reattach it to match.
    formatted = formatted.replace(/\n[ \t]*((?:<br>)+)\n[ \t]*/g, "$1");

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
