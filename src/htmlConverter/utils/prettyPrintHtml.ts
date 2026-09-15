
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

    // Prettier's html printer reflows the content of ANY element that doesn't fit
    // printWidth onto its own indented lines — fine for structural markup (<table>/<tr>/
    // <td>/<div>/<p>, which is what makes deeply nested email markup readable), but wrong
    // for a decorative inline run (<b>/<strong>/<em>/<i>/<u>, e.g. a long bold/italic
    // sentence): that content isn't whitespace-normalized elsewhere in the pipeline the
    // way <a> content is (see the <a>-specific cleanup below) and can legitimately end
    // with a real trailing space before the next inline element (e.g. "give us "
    // immediately followed by "<em>only a few years.</em>") — there is no way to tell,
    // from Prettier's output alone, which of its reflow newlines represent that real
    // space and which are pure reflow padding it inserted where there was none at all.
    // Swap each decorative element for a single whitespace-free placeholder token BEFORE
    // Prettier ever sees it, so it physically cannot split one internally, then restore
    // the exact original markup byte-for-byte afterward.
    const decorativeTagPattern = /<(b|strong|em|i|u)\b[^>]*>[\s\S]*?<\/\1>/gi;
    const savedDecorative: string[] = [];
    const withPlaceholders = html.replace(decorativeTagPattern, (match) => {
      const token = `\x02DECOR${savedDecorative.length}\x03`;
      savedDecorative.push(match);
      return token;
    });

    let formatted = await format(withPlaceholders, {
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
    // onto its own line — this app's convention instead keeps it as a
    // trailing suffix on the text it ends ("text<br>", next text starts on
    // the following line), so only the LEADING newline before it is removed,
    // not the trailing one. A <br><br> paragraph separator keeps its own
    // line: the negative lookahead only matches a <br> that ISN'T
    // immediately followed by another one, so a glued <br><br> pair
    // (produced by the whitespace-collapse above) never matches here.
    formatted = formatted.replace(/\n[ \t]*(<br>(?!<br>))/g, "$1");

    formatted = formatted.replace(/\s+([.,!?:;])/g, "$1");

    formatted = formatted.replace(/(<a[^>]*>)([\s\S]*?)(<\/a>)/gi, (_match, startTag, content, endTag) => {
      const cleanContent = content.replace(/\s+/g, " ").trim();
      return `${startTag}${cleanContent}${endTag}`;
    });

    // eslint-disable-next-line no-control-regex -- \x02/\x03 are deliberate sentinel bytes marking saved decorative-tag placeholders
    formatted = formatted.replace(/\x02DECOR(\d+)\x03/g, (_m, i) => savedDecorative[+i] ?? "");

    return formatted;
  } catch (error) {
    console.error("prettyPrintHtml: Prettier formatting failed, returning original HTML", error);
    return html;
  }
}
