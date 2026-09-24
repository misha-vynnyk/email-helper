/**
 * Unified `formatHtml`/`formatMjml` — replaces the three near-duplicate
 * `formatter.ts`/`ttt/formatter.ts`/`alphaone/formatter.ts` pipelines with one
 * parameterized implementation driven by `SimpleTokens` + the template set
 * from `buildSimpleTemplates(tok)`.
 *
 * Stage 3 of /Users/mykhailovynnyk/.claude/plans/tidy-bubbling-oasis.md. The
 * three original files are intentionally left in place (not deleted yet) per
 * the user's request: switch the live wiring to this implementation first,
 * verify manually end-to-end, and only remove the old forks in a later,
 * separate cleanup step once confirmed.
 *
 * Cosmetic normalization (approved, same category as the whitespace
 * normalization documented in `config/templates.ts`): the synthesized
 * `<a>` style-attribute property order differed between profiles
 * (`font-family;text-decoration;font-weight;color` in default/ttt vs
 * `font-family;font-weight;color;text-decoration` in alphaone) — CSS
 * property order inside a `style` attribute has no rendering effect, so this
 * file normalizes to one consistent order everywhere.
 */
import * as colorUtils from "../utils/colorUtils";
import * as htmlUtils from "../utils/htmlUtils";
import { extractDeclaredImageWidth } from "../utils/imageUtils";
import type { buildSimpleTemplates } from "./config/templates";
import type { SimpleTokens } from "./config/tokens";

type SimpleTemplates = ReturnType<typeof buildSimpleTemplates>;

// Minimum left-indent (px) on a raw-pasted <p>/<div> that's treated as an intentional
// "Відступ" quote block rather than incidental padding — matches the <h4> quote
// template's own 20px (config/templates.ts quote/centerQuote).
const QUOTE_INDENT_THRESHOLD_PX = 20;

function getInlineStyleValue(style: string, property: string): string | null {
  const targetProperty = property.trim().toLowerCase();
  const declarations = style.split(";");

  for (const declaration of declarations) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    if (!rawProperty || rawValueParts.length === 0) continue;

    if (rawProperty.trim().toLowerCase() !== targetProperty) continue;

    const rawValue = rawValueParts.join(":").trim();
    return rawValue || null;
  }

  return null;
}

function linkAnchorStyle(tok: SimpleTokens): string {
  return `font-family:${tok.fontFamily};text-decoration: underline;font-weight: 700; color: ${tok.color.link};`;
}

// ---------------------------------------------------------------------------------
// flattenNestedFormatting — normalizes genuinely NESTED raw formatting tags (e.g.
// <em><strong>text</strong></em>, or a formatting tag wrapping a native <a> link) from
// non-GDocs sources into the <span style="..."> convention the existing span-based
// parser in processStyles() already understands, instead of duplicating that parser's
// tag-emission priority logic a second time. Google Docs paste never nests raw <em>/
// <strong>/<b>/<i>/<u> tags — it always emits ONE flat <span style="..."> per run — so
// this pass is deliberately narrow: it only touches a formatting element that itself
// contains ANOTHER formatting element or a native <a> link as a descendant. A bare,
// non-nested <em>text</em> is left completely untouched and never reaches this code.
// ---------------------------------------------------------------------------------

const AMBIENT_ITALIC_SENTINEL_ATTR = "data-simple-ambient-italic";
const FORMATTING_TAG_NAMES = new Set(["B", "STRONG", "EM", "I", "U"]);

interface InlineFlags {
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

function flagsFromTagAndStyle(tagName: string, style: string): Partial<InlineFlags> {
  const flags: Partial<InlineFlags> = {};
  if (tagName === "B" || tagName === "STRONG") flags.bold = true;
  if (tagName === "EM" || tagName === "I") flags.italic = true;
  if (tagName === "U") flags.underline = true;
  if (/font-weight:\s*(700|bold)/i.test(style)) flags.bold = true;
  if (/font-style:\s*italic/i.test(style)) flags.italic = true;
  if (/text-decoration(?:-line)?\s*:[^;]*\bunderline\b/i.test(style)) flags.underline = true;
  return flags;
}

function mergeFlags(ctx: InlineFlags, own: Partial<InlineFlags>): InlineFlags {
  return { bold: ctx.bold || Boolean(own.bold), italic: ctx.italic || Boolean(own.italic), underline: ctx.underline || Boolean(own.underline) };
}

function escapeHtmlText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function styleStringFromFlags(flags: InlineFlags): string {
  const parts: string[] = [];
  if (flags.bold) parts.push("font-weight:700");
  if (flags.italic) parts.push("font-style:italic");
  if (flags.underline) parts.push("text-decoration:underline");
  return parts.join(";");
}

// Text inside a link that sits under an italic ancestor gets a sentinel marker (not a
// real style) — bold/underline need no marker since every link this pipeline emits is
// already bold+underlined by its own fixed style (linkAnchorStyle), only italic isn't.
function flattenLinkChild(node: Node, ctx: InlineFlags): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node as Text).data;
    if (!ctx.italic || !text) return escapeHtmlText(text);
    return `<span ${AMBIENT_ITALIC_SENTINEL_ATTR}="1">${escapeHtmlText(text)}</span>`;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;
  if (FORMATTING_TAG_NAMES.has(el.tagName)) {
    const own = flagsFromTagAndStyle(el.tagName, el.getAttribute("style") ?? "");
    const merged = mergeFlags(ctx, own);
    return Array.from(el.childNodes)
      .map((child) => flattenLinkChild(child, merged))
      .join("");
  }
  // Anything else inside a link (rare) — leave completely untouched.
  return (el as HTMLElement).outerHTML;
}

// Scoped deliberately narrow: only TEXT, <a>, and the 5 formatting tags are descended
// into. Every other element (including plain <span style="color:...">, <img>, etc.) is
// left as outerHTML verbatim, with no recursion — this sidesteps having to merge this
// pass's flag-derived style with an element's own unrelated inline style (e.g. color),
// which would otherwise risk nesting a second <span style="..."> inside the first one
// and confusing the existing single-level span regex in processStyles().
function flattenSubtree(node: Node, ctx: InlineFlags): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = escapeHtmlText((node as Text).data);
    if (!ctx.bold && !ctx.italic && !ctx.underline) return text;
    return `<span style="${styleStringFromFlags(ctx)}">${text}</span>`;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as Element;

  if (el.tagName === "A") {
    const clone = el.cloneNode(false) as HTMLElement;
    clone.innerHTML = Array.from(el.childNodes)
      .map((child) => flattenLinkChild(child, ctx))
      .join("");
    return clone.outerHTML;
  }

  if (FORMATTING_TAG_NAMES.has(el.tagName)) {
    const own = flagsFromTagAndStyle(el.tagName, el.getAttribute("style") ?? "");
    const merged = mergeFlags(ctx, own);
    return Array.from(el.childNodes)
      .map((child) => flattenSubtree(child, merged))
      .join("");
  }

  // A non-formatting wrapper (e.g. a plain <span class="..."> from non-GDocs paste) sits
  // literally between the ambient <em>/<strong> and its text. Returning its outerHTML
  // verbatim (as below) would silently drop whatever bold/italic/underline `ctx` carries
  // in from an ancestor formatting tag. Merge the ambient flags directly into the
  // element's own style attribute instead of wrapping it in a NEW <span style="...">:
  // nesting a second style-bearing span would confuse processStyles()'s single-level
  // (non-greedy up-to-the-next-</span>) span regex.
  if (ctx.bold || ctx.italic || ctx.underline) {
    const clone = el.cloneNode(true) as HTMLElement;
    const existingStyle = clone.getAttribute("style") ?? "";
    const ownFlags = flagsFromTagAndStyle(clone.tagName, existingStyle);
    const merged = mergeFlags(ctx, ownFlags);
    const ambientDecl = styleStringFromFlags(merged);
    clone.setAttribute("style", existingStyle ? `${existingStyle};${ambientDecl}` : ambientDecl);
    return clone.outerHTML;
  }

  return (el as HTMLElement).outerHTML;
}

function hasNestedFormattingOrLink(el: Element): boolean {
  for (const descendant of Array.from(el.querySelectorAll("*"))) {
    if (FORMATTING_TAG_NAMES.has(descendant.tagName) || descendant.tagName === "A") return true;
  }
  return false;
}

function flattenNestedFormatting(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const container = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html").body.firstElementChild;
  if (!container) return html;

  // Only the specific matched element's own (pre-mutation) outerHTML is substituted back
  // into the ORIGINAL string below — the rest of `html` is never round-tripped through
  // the parsed DOM. Serializing the whole container (container.innerHTML) instead would
  // leak the browser's HTML5-parser auto-correction of any unrelated malformed markup
  // elsewhere in the paste (e.g. mismatched <p>/<div> nesting, common from Word/Mail
  // paste) into the output, even though that markup has nothing to do with this pass.
  let result = html;

  function walk(parent: Node): void {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        // Images never want inline text formatting wrapped around them (same rule as
        // the span-based parser below) — skip any subtree that contains one.
        if (FORMATTING_TAG_NAMES.has(el.tagName) && !el.querySelector("img") && hasNestedFormattingOrLink(el)) {
          const original = (el as HTMLElement).outerHTML;
          const own = flagsFromTagAndStyle(el.tagName, el.getAttribute("style") ?? "");
          const ctx: InlineFlags = { bold: Boolean(own.bold), italic: Boolean(own.italic), underline: Boolean(own.underline) };
          const replacement = Array.from(el.childNodes)
            .map((c) => flattenSubtree(c, ctx))
            .join("");
          // If the DOM-serialized outerHTML doesn't literally appear in the source (e.g.
          // the source used single-quoted or unquoted attributes) skip this element rather
          // than guess — silently leaving it as raw nested markup is far safer than
          // corrupting unrelated content via a full-container reserialization.
          if (result.includes(original)) result = result.replace(original, replacement);
          continue;
        }
        // The reverse structure — a native <a> link directly wrapping nested formatting
        // tags (e.g. <a><strong><u>...<em>destroy</em>...</u></strong></a>), rather than
        // a formatting tag wrapping the link — never reaches the case above, since the
        // <a> itself isn't a formatting tag. Normalize its OWN content in place (keep the
        // <a> tag/attributes untouched) using the same italic-only sentinel convention;
        // hasNestedFormattingOrLink(el) is reused here — an <a> can't itself nest another
        // <a>, so for an <a> element it correctly reduces to "contains a formatting tag".
        if (el.tagName === "A" && !el.querySelector("img") && hasNestedFormattingOrLink(el)) {
          const original = (el as HTMLElement).outerHTML;
          const flattenedInner = Array.from(el.childNodes)
            .map((c) => flattenLinkChild(c, { bold: false, italic: false, underline: false }))
            .join("");
          const clone = el.cloneNode(false) as HTMLElement;
          clone.innerHTML = flattenedInner;
          const replacement = clone.outerHTML;
          if (result.includes(original)) result = result.replace(original, replacement);
          continue;
        }
      }
      walk(child);
    }
  }

  walk(container);
  return result;
}

function italicLinks(htmlContent: string, tok: SimpleTokens): string {
  // Save native <a href="..."> links before stripping so they survive. The captured href
  // value itself is never used below (every link's real destination is discarded in favor
  // of tok.placeholderHref regardless) — this pipeline treats every <a> as a link to be
  // filled in later during the upload flow, not as a real outbound URL to preserve. This
  // used to require an http(s):// href specifically, which silently dropped a common
  // real-world pattern: an author's own placeholder marker (e.g. `href="[insert link]"`)
  // standing in for a link that hasn't been generated yet — the SECOND, unconditional
  // `<a>`-tag strip a few lines below removed the tag entirely, since nothing captured it
  // into savedLinks first, leaving plain unlinked text with no href at all. Matching any
  // non-empty href value (not just http(s):// ones) still excludes a bare `<a name="...">`
  // bookmark anchor (no href attribute) or `href=""`.
  const savedLinks: string[] = [];
  htmlContent = htmlContent.replace(/(<a\s[^>]*href=(["'])([^"']+)\2[^>]*>)([\s\S]*?)<\/a>/gi, (_match, openTag, _q, _href, inner) => {
    const text = inner.replace(/<[^>]+>/g, "");

    // Extract leading/trailing spaces to correctly place them OUTSIDE the link tag
    const leadingSpaceMatch = text.match(/^(\s*)/);
    const trailingSpaceMatch = text.match(/(\s*)$/);

    const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1] : "";
    const trailingSpaces = trailingSpaceMatch ? trailingSpaceMatch[1] : "";
    const coreText = text.trim();

    if (!coreText) {
      // If the link contains image(s) but no text — preserve the img tags so they
      // reach wrapTextInBlock for proper template wrapping. Without this the images
      // inside <a href="..."><img ...></a> are silently dropped.
      const imgTags = inner.match(/<img[^>]*>/gi);
      if (imgTags && imgTags.length > 0) return imgTags.join("");
      return text; // just whitespace — safe to drop
    }

    // Only the default profile checks native <a> links for italic styling and
    // wraps the text in <em> — ttt/alphaone never do this check at all. Checks both the
    // GDocs shape (a nested <span style="font-style:italic"> inside the link) AND italic
    // declared directly on the <a> tag's own style attribute (common from non-GDocs
    // sources — Mail.app/web paste rarely bother with an extra nested span for a link
    // that's italic on its own, they just style the <a> itself).
    const hasNarrowGDocsItalic = tok.detectItalicNativeLinks && (/font-style:\s*italic/i.test(inner) || /font-style:\s*italic/i.test(openTag));
    // Universal, profile-independent signal: flattenNestedFormatting() (below) injects
    // this sentinel when the link sits inside an ancestor <em>/<i> — structurally the
    // link IS italic there regardless of profile, unlike the narrow GDocs check above
    // (which only reacts to styling on the link's own content, not an ancestor's).
    // Only counts when the sentinel covers the link's ENTIRE text — a link that merely
    // contains a nested <em> around one word (e.g. "...a move you <em>can</em> make...")
    // is not structurally an italic link, and forcing the whole link text into <em> would
    // be a false positive; dropping that partial emphasis is preferable since italic
    // isn't visually distinct on these already bold+underlined links anyway.
    const sentinelSpanRegex = new RegExp(`<span ${AMBIENT_ITALIC_SENTINEL_ATTR}="1">([\\s\\S]*?)</span>`, "gi");
    const textOutsideSentinel = inner.replace(sentinelSpanRegex, "").replace(/<[^>]+>/g, "").trim();
    const hasAmbientItalic = new RegExp(AMBIENT_ITALIC_SENTINEL_ATTR).test(inner) && textOutsideSentinel === "";
    const hasItalic = hasNarrowGDocsItalic || hasAmbientItalic;
    const linkContent = hasItalic ? `<em>${coreText}</em>` : coreText;
    const placeholder = `\x02LINK${savedLinks.length}\x03`;
    savedLinks.push(`<a href="${tok.placeholderHref}" style="${linkAnchorStyle(tok)}">${linkContent}</a>`);
    return `${leadingSpaces}${placeholder}${trailingSpaces}`;
  });

  htmlContent = htmlContent.replace(/<a[^>]*>/gi, "").replace(/<\/a>/gi, "");

  const regex = /(<span\b[^>]*style=(["'])[\s\S]*?\2[^>]*>[\s\S]*?<\/span>)/gi;

  htmlContent = htmlContent.replace(regex, (match) => {
    const styleMatch = match.match(/style=(["'])([\s\S]*?)\1/i);
    if (!styleMatch) return match;
    const style = styleMatch[2];
    const innerText = match.replace(/<[^>]+>/g, "");
    const color = getInlineStyleValue(style, "color");
    const fontStyle = getInlineStyleValue(style, "font-style");

    if (!color || !fontStyle || !/italic/i.test(fontStyle)) {
      return match;
    }

    if (colorUtils.isLinkColor(color)) {
      const leadingSpaceMatch = innerText.match(/^(\s*)/);
      const trailingSpaceMatch = innerText.match(/(\s*)$/);

      const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1] : "";
      const trailingSpaces = trailingSpaceMatch ? trailingSpaceMatch[1] : "";
      const coreText = innerText.trim();

      if (!coreText) return match;

      return `${leadingSpaces}<a href="${tok.placeholderHref}" style="${linkAnchorStyle(tok)}"><em>${coreText}</em></a>${trailingSpaces}`;
    }
    return match;
  });

  // eslint-disable-next-line no-control-regex -- \x02/\x03 are deliberate sentinel bytes marking saved-link placeholders
  htmlContent = htmlContent.replace(/\x02LINK(\d+)\x03/g, (_, i) => savedLinks[+i] ?? "");

  return htmlContent;
}

function linksStyles(htmlContent: string, tok: SimpleTokens): string {
  const reg = /<span\b[^>]*style=(["'])([\s\S]*?)\1[^>]*>([\s\S]*?)<\/span>/gi;

  htmlContent = htmlContent.replace(reg, (match, _quote, style, innerText) => {
    const color = getInlineStyleValue(style, "color");
    if (!color) return match;

    if (colorUtils.isLinkColor(color)) {
      const leadingSpaceMatch = innerText.match(/^(\s*)/);
      const trailingSpaceMatch = innerText.match(/(\s*)$/);

      const leadingSpaces = leadingSpaceMatch ? leadingSpaceMatch[1] : "";
      const trailingSpaces = trailingSpaceMatch ? trailingSpaceMatch[1] : "";
      // Avoid mutating tags internally if any exist, just strip ends
      const coreText = innerText.slice(leadingSpaces.length, innerText.length - trailingSpaces.length);

      if (!coreText) return match;

      return `${leadingSpaces}<a href="${tok.placeholderHref}" style="${linkAnchorStyle(tok)}">${coreText}</a>${trailingSpaces}`;
    }
    return match;
  });
  return htmlContent;
}

// Regression (real-world report): Mail.app/Safari-style paste sometimes marks a centered
// paragraph with the legacy HTML `align="center"` attribute instead of (or in addition to)
// a `text-align:center` style declaration — e.g. `<p align="center" style="...(no
// text-align at all)...">`. Every centering check in this pipeline (the text-align:center
// regexes applied below, for <p>/<h1>/<h4>/<h6>) only ever looks inside the style
// attribute, so an `align="center"`-only paragraph silently rendered left-aligned. Folding
// it into the style convention here — before those regexes run — lets the existing,
// already-tested detection handle it unchanged. Scoped to "center" only (the one alignment
// this pipeline's templates actually branch on); an explicit text-align in the same style
// wins over a stray/conflicting align attribute rather than being overridden by it.
function normalizeAlignAttribute(htmlContent: string): string {
  return htmlContent.replace(/<(p|div|h[1-6])\b([^>]*)>/gi, (match, tag, attrs) => {
    if (!/\salign\s*=\s*(["'])center\1/i.test(` ${attrs}`)) return match;
    const withoutAlign = attrs.replace(/\s+align\s*=\s*(["'])center\1/i, "");
    const styleMatch = withoutAlign.match(/style\s*=\s*(["'])([\s\S]*?)\1/i);
    if (styleMatch) {
      if (/text-align\s*:/i.test(styleMatch[2])) return `<${tag}${withoutAlign}>`;
      return `<${tag}${withoutAlign.replace(styleMatch[0], `style="${styleMatch[2]};text-align:center;"`)}>`;
    }
    return `<${tag}${withoutAlign} style="text-align:center;">`;
  });
}

// Experimental text-color passthrough (opt-in, off by default — see `preserveTextColors` on
// formatHtml/formatMjml): resolves an input span's `color` to one of `tok.color.red`/`green`
// when it classifies into one of those two buckets, or `null` for everything else (grayscale,
// blue/link colors already handled by italicLinks/linksStyles above, or any other hue).
function resolveBucketColor(style: string, tok: SimpleTokens, preserveTextColors: boolean): string | null {
  if (!preserveTextColors) return null;
  const color = getInlineStyleValue(style, "color");
  if (!color || colorUtils.isLinkColor(color)) return null;
  const bucket = colorUtils.classifyColorBucket(color);
  return bucket ? tok.color[bucket] : null;
}

function processStyles(htmlContent: string, tok: SimpleTokens, preserveTextColors: boolean): string {
  htmlContent = normalizeAlignAttribute(htmlContent);

  // A raw <b> reaching here (flattenNestedFormatting only touches genuinely NESTED
  // formatting, so a bare <b> is untouched) is either (a) Google Docs' own redundant
  // wrapper around a run it ALSO wraps in a <span style="font-weight:700">, safe to
  // strip since the span-style parser below regenerates the canonical <b> from that
  // span — or (b) the case reported from Mail.app/Safari paste, where the <b> tag
  // itself is the ONLY carrier of the bold semantic (its own style never declares
  // font-weight, and there's no inner span to regenerate it from). Unconditionally
  // stripping every <b> assumed only case (a) and silently dropped bold text for (b).
  htmlContent = htmlContent.replace(/<b\b([^>]*)>([\s\S]*?)<\/b>/gi, (_match, attrs, inner) => {
    if (/font-weight:\s*(700|bold)/i.test(inner)) return inner;

    const styleMatch = attrs.match(/style\s*=\s*(["'])([\s\S]*?)\1/i);
    const style = styleMatch ? styleMatch[2] : "";
    const italic = /font-style:\s*italic/i.test(style);
    const underline = /text-decoration(?:-line)?\s*:[^;]*\bunderline\b/i.test(style);
    // Case (b) above (Mail.app/Safari's bare <b>) is the ONLY carrier of its own style —
    // there's no inner <span> for a color declared here to fall back on, so it must be
    // resolved on this same pass or it's lost entirely, unlike the <span>-driven path
    // below, which already does this via resolveBucketColor.
    const resolvedColor = resolveBucketColor(style, tok, preserveTextColors);
    const withColor = (tagStyle: string) => (resolvedColor ? (tagStyle ? `${tagStyle};color:${resolvedColor}` : `color:${resolvedColor}`) : tagStyle);
    const styleAttr = (tagStyle: string) => (tagStyle ? ` style="${tagStyle}"` : "");

    if (italic && underline) return `<em${styleAttr(withColor("text-decoration: underline;font-weight: bold;"))}>${inner}</em>`;
    if (italic) return `<b${styleAttr(withColor("font-style: italic;"))}>${inner}</b>`;
    if (underline) return `<b${styleAttr(withColor("text-decoration: underline;"))}>${inner}</b>`;
    return `<b${styleAttr(withColor(""))}>${inner}</b>`;
  });

  // Sentinel-protected storage for color-only spans (no bold/italic/underline) produced below —
  // mirrors the `savedLinks`/`\x02LINK\x03` placeholder technique in `italicLinks` above, since
  // a bare `<span style="color:...">` would otherwise be destroyed by this function's own later
  // catch-all span-strip (a few lines down from here).
  const savedColorSpans: string[] = [];

  // Single-pass style detection: parse style once, emit correct semantic tag
  htmlContent = htmlContent.replace(/<span[^>]*style=["']([^"']*)["'][^>]*>(.*?)<\/span>/gi, (_match: string, style: string, inner: string) => {
    // An image never wants inline text formatting (bold/italic/underline) — wrapping it
    // here would leave the open/close halves of that tag stranded around wrapTextInBlock's
    // later multi-row <img> replacement, splitting the output table across the tag boundary.
    if (/^\s*<img[^>]*>\s*$/i.test(inner)) return inner;

    const bold = /font-weight:\s*700/i.test(style);
    const italic = /font-style:\s*italic/i.test(style);
    const underline = /text-decoration(?:-line)?\s*:[^;]*\bunderline\b/i.test(style);

    const resolvedColor = resolveBucketColor(style, tok, preserveTextColors);
    const withColor = (tagStyle: string) => (resolvedColor ? (tagStyle ? `${tagStyle};color:${resolvedColor}` : `color:${resolvedColor}`) : tagStyle);
    const styleAttr = (tagStyle: string) => (tagStyle ? ` style="${tagStyle}"` : "");

    if (bold && italic && underline) return `<em${styleAttr(withColor("text-decoration: underline;font-weight: bold;"))}>${inner}</em>`;
    if (italic && underline) return `<em${styleAttr(withColor("text-decoration: underline;"))}>${inner}</em>`;
    if (bold && italic) return `<b${styleAttr(withColor("font-style: italic;"))}>${inner}</b>`;
    if (bold && underline) return `<b${styleAttr(withColor("text-decoration: underline;"))}>${inner}</b>`;
    if (underline) return `<u${styleAttr(withColor(""))}>${inner}</u>`;
    if (bold) return `<b${styleAttr(withColor(""))}>${inner}</b>`;
    if (italic) return `<em${styleAttr(withColor(""))}>${inner}</em>`;

    if (resolvedColor) {
      // eslint-disable-next-line no-control-regex -- \x04/\x05 are deliberate sentinel bytes, matching the \x02/\x03 LINK convention above
      const placeholder = `\x04COLOR${savedColorSpans.length}\x05`;
      savedColorSpans.push(`<span style="color:${resolvedColor}">${inner}</span>`);
      return placeholder;
    }

    return inner; // No formatting, no color — strip the span
  });

  // Normalize raw semantic tags from non-GDocs sources (plain web/Mail-app paste uses
  // <strong>/<center>/<blockquote> directly — Google Docs paste never emits these, so
  // nothing above handles them) into the conventions the rest of this pipeline expects.

  // <strong> arrives here — AFTER the <b>-strip above — specifically so the <b> it
  // produces survives that regex instead of being immediately stripped by it.
  htmlContent = htmlContent.replace(/<strong\b[^>]*>/gi, "<b>").replace(/<\/strong>/gi, "</b>");

  // <i> is the same situation as <strong> above: a bare (non-nested) <i> from non-GDocs
  // paste never reaches flattenNestedFormatting (which only touches genuinely nested
  // formatting), so without this it would survive all the way to output as a raw <i>
  // instead of the profile's italicTag convention that applyItalicTag() applies below.
  htmlContent = htmlContent.replace(/<i\b[^>]*>/gi, "<em>").replace(/<\/i>/gi, "</em>");

  // <center> wrapping an image is pure noise: wrapImg already centers every image via
  // its own align="center", regardless of source markup — so just unwrap. <center>
  // wrapping text has no dedicated template here, so convert it to the text-align:center
  // <p> convention the centerText applyTemplate step (below, in formatHtml/formatMjml)
  // already recognizes. Images are excluded from that conversion because wrapping one in
  // <p style="text-align:center"> would route it through centerText's span-based block
  // instead of wrapTextInBlock's <tr>-based image block, nesting a <tr> inside a <span>.
  htmlContent = htmlContent.replace(/<center\b[^>]*>([\s\S]*?)<\/center>/gi, (_match, inner) => {
    if (/<img\b/i.test(inner)) return inner;
    // If <center> already wraps a block-level <div>/<p> (e.g. an indented quote or a
    // GDocs-style <div style="...">), merge the centering into THAT block's own style
    // instead of adding a new outer <p>: an outer wrap would become <p><p>...</p></p>
    // once the <div>→<p> conversion below also fires on the inner tag, and the later
    // single-level, non-greedy <p>...</p> capture regexes elsewhere in this pipeline
    // can't handle that nesting — they'd stop at the inner </p>, corrupting the output.
    const blockMatch = inner.match(/<(div|p)\b([^>]*)>/i);
    if (blockMatch) {
      const [tagOpen, tagName, attrs] = blockMatch;
      const styleMatch = attrs.match(/style\s*=\s*(["'])([\s\S]*?)\1/i);
      const newAttrs = styleMatch ? attrs.replace(styleMatch[0], `style="${styleMatch[2]};text-align:center;"`) : `${attrs} style="text-align:center;"`;
      return inner.replace(tagOpen, `<${tagName}${newAttrs}>`);
    }
    return `<p style="text-align:center;">${inner}</p>`;
  });

  // <blockquote> has no dedicated template here either — its typical contents (e.g. a
  // <p style="text-align:center"> pull-quote) are already matched directly by the
  // centerText step once the blockquote wrapper itself is out of the way — so unwrap.
  htmlContent = htmlContent.replace(/<\/?blockquote[^>]*>/gi, "");

  // Convert <div> to <p> so block structure is preserved by the paragraph formatter later.
  // Keep the div's own style attribute (e.g. text-align:center) — browsers commonly
  // normalize pasted Google Docs paragraphs into <div style="text-align:center">
  // rather than <p>, and dropping it here silently un-centers that block downstream.
  htmlContent = htmlContent.replace(/<div\b([^>]*)>/gi, (_match, attrs) => {
    const styleMatch = attrs.match(/style\s*=\s*(["'])([\s\S]*?)\1/i);
    return styleMatch ? `<p style="${styleMatch[2]}">` : "<p>";
  });
  htmlContent = htmlContent.replace(/<\/div>/gi, "</p>");

  // A <p>/<div>-turned-<p> with a meaningful left indent is this pipeline's existing
  // "Відступ" (padding) convention — the same block the <h4> marker already produces
  // (20px both sides, config/templates.ts quote/centerQuote). Route it through that
  // exact same, already-tested <h4> path instead of a new template. Threshold matches
  // that template's own 20px — narrower indents (e.g. a stray few px) are left alone
  // rather than risk misreading incidental padding as an intentional quote.
  htmlContent = htmlContent.replace(/<p([^>]*)\bstyle="([^"]*)"([^>]*)>([\s\S]*?)<\/p>/gi, (match, before, style, after, inner) => {
    const paddingLeftMatch = style.match(/padding-left\s*:\s*(\d+(?:\.\d+)?)px/i);
    if (!paddingLeftMatch || parseFloat(paddingLeftMatch[1]) < QUOTE_INDENT_THRESHOLD_PX) return match;
    return `<h4${before}style="${style}"${after}>${inner}</h4>`;
  });

  // Preserve basic spacing for tables before stripping their structure
  htmlContent = htmlContent.replace(/<\/td>(?!\s*<\/tr>)/gi, " ");
  htmlContent = htmlContent.replace(/<\/th>(?!\s*<\/tr>)/gi, " ");
  htmlContent = htmlContent.replace(/<\/tr>/gi, "<br>\n");

  // Delete table tags
  htmlContent = htmlContent.replace(/<\/?(table|tbody|thead|tr|td|th|col|colgroup)[^>]*>/gi, "");

  // Delete remaining empty/wrapper tags
  htmlContent = htmlContent.replace(/<a[^>]*>\s*<\/a>/g, " ");
  htmlContent = htmlContent.replace(/<span[^>]*>/gi, "").replace(/<\/span>/gi, "");
  htmlContent = htmlContent.replace(/<b>\s*<\/b>/g, " ");

  // Restore color-only spans saved above — must happen after the catch-all span-strip since
  // that regex would otherwise destroy the very span this placeholder stands in for.
  // eslint-disable-next-line no-control-regex -- \x04/\x05 sentinel bytes, see savedColorSpans above
  htmlContent = htmlContent.replace(/\x04COLOR(\d+)\x05/g, (_, i) => savedColorSpans[+i] ?? "");

  return htmlContent;
}

function applyTemplate(content: string, regex: RegExp, templateFn: (content: string) => string): string {
  return content.replace(regex, (_match, innerContent) => templateFn(innerContent));
}

// The headline/centerHeadline templates already force font-weight:bold on their wrapping
// tag (see config/templates.ts) — a bare <b>...</b> a raw (non-GDocs) <h1><strong> paste
// produces via processStyles' <strong>→<b> normalization is therefore pure redundant
// nesting, not a second, independent emphasis. Only strip the attribute-less <b> tag
// (never <b style="...">, which carries real extra info like italic/underline) so this
// stays a no-op for every other case.
function stripRedundantBoldWrapper(content: string): string {
  return content.replace(/<b>/gi, "").replace(/<\/b>/gi, "");
}

// Single, final retag point for every <em> in the output — regardless of whether it came
// from the source verbatim, from the span-style parser, or from the nested-formatting
// merge pass — so profiles needing a different italic tag (see SimpleTokens.italicTag)
// don't require touching any of the logic that actually emits <em>.
function applyItalicTag(content: string, tok: SimpleTokens): string {
  if (tok.italicTag === "em") return content;
  return content.replace(/<em(?=[\s>])/gi, `<${tok.italicTag}`).replace(/<\/em>/gi, `</${tok.italicTag}>`);
}

// Wraps images and the whole content in the outer block (span for default, div for ttt/alphaone).
function wrapTextInBlock(htmlContent: string, templateFn: (content: string, declaredWidth?: number) => string, type: "html" | "mjml", tok: SimpleTokens): string {
  // 1. Replace Images
  htmlContent = htmlContent.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (fullMatch, src) => {
    // The pasted <img>'s own `width` attribute is only a reliable stand-in for the
    // image's real resolution in the one case extractDeclaredImageWidth's own docs
    // describe: an unresolvable GDocs placeholder (`src="[IMAGE: ...]"`), where no
    // better signal exists. For a normal resolvable src (a real http(s)/data URL —
    // e.g. an image pasted from a Mail client, which stamps whatever display width
    // that source email happened to use, unrelated to this image's real pixels or
    // the intended banner width here) it must NOT be trusted: the later real-width
    // capping pass (capImageWidthsInContent, post-upload) already shrinks the
    // container down correctly using the image's genuinely measured pixel size.
    // Trusting the raw attribute here as well caused a small, unrelated declared
    // width (e.g. a 250px icon from the source layout) to wrongly shrink a full-width
    // banner image before any real measurement ever happened.
    const declaredWidth = src.includes("[IMAGE:") ? extractDeclaredImageWidth(fullMatch) : undefined;
    return templateFn(src, declaredWidth);
  });

  // 2. Wrap the whole result in the default block
  if (type === "html") {
    htmlContent = `<tr>
                      <td style="font-family:${tok.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;padding-top: ${tok.blockPaddingV}; padding-bottom: ${tok.blockPaddingV};">
                                <${tok.blockWrapTag} style="font-family:${tok.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                                    ${htmlContent}
                                </${tok.blockWrapTag}>
                      </td>
                    </tr>`;
  } else {
    htmlContent = `
            <tr>
              <td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;">
                <div style="font-family:${tok.fontFamily};font-size:18px;font-style:normal;font-weight:normal;line-height:1.5;text-align:left;color:#000000;">
                    ${htmlContent}
                </div>
              </td>
            </tr>
        `;
  }
  return htmlContent;
}

export function formatHtml(editorContent: string, tok: SimpleTokens, tmpl: SimpleTemplates, oneBrSymbol?: string, preserveTextColors = false): string {
  let content = editorContent;
  content = content.replace(/<meta[^>]*>/gi, "");
  content = content.replace(/<br\b[^>]*>/gi, "<br>");
  content = flattenNestedFormatting(content);
  content = htmlUtils.mergeSimilarTags(content);
  content = italicLinks(content, tok);
  content = linksStyles(content, tok);
  content = htmlUtils.replaceAllEmojisAndSymbolsExcludingHTML(content);
  content = processStyles(content, tok, preserveTextColors);

  // Block Wrappers
  content = applyTemplate(content, /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, tmpl.htmlTemplates.centerText);
  content = applyTemplate(content, /<h6[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h6>/gi, tmpl.htmlTemplates.smallCenterText);
  content = applyTemplate(content, /<h6[^>]*>([\s\S]*?)<\/h6>/gi, tmpl.htmlTemplates.smallText);
  content = applyTemplate(content, /<h1[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h1>/gi, (c) => tmpl.htmlTemplates.centerHeadline(stripRedundantBoldWrapper(c)));
  content = applyTemplate(content, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, (c) => tmpl.htmlTemplates.headline(stripRedundantBoldWrapper(c)));
  content = applyTemplate(content, /<h5[^>]*>([\s\S]*?)<\/h5>/gi, tmpl.htmlTemplates.button);
  content = applyTemplate(content, /<h4[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h4>/gi, tmpl.htmlTemplates.centerQuote);
  content = applyTemplate(content, /<h4[^>]*>([\s\S]*?)<\/h4>/gi, tmpl.htmlTemplates.quote);

  content = htmlUtils.addBrAfterClosingP(content);
  content = content.replace(/\s*\[\[BR_SEP\]\]\s*/g, "\n<br><br>\n");
  content = htmlUtils.removeStylesFromLists(content);

  // Complex wrapping (Images + Body)
  content = wrapTextInBlock(content, tmpl.htmlTemplates.wrapImg, "html", tok);

  // More wrappers
  content = applyTemplate(content, /i-r-s([\s\S]*?)i-r-s-e/gi, tmpl.htmlTemplates.rightSideImg);
  content = applyTemplate(content, /i-l-s([\s\S]*?)i-l-s-e/gi, tmpl.htmlTemplates.leftSideImg);
  content = applyTemplate(content, /sign-i([\s\S]*?)sign-i-e/gi, tmpl.htmlTemplates.signatureImg);
  content = applyTemplate(content, /ftr-s([\s\S]*?)ftr-e/gi, tmpl.htmlTemplates.footerBlock);
  content = applyTemplate(content, /ftr-c([\s\S]*?)ftr-c-e/gi, tmpl.htmlTemplates.footerCenterBlock);

  content = htmlUtils.cleanEmptyHtmlTags(content);
  content = tmpl.htmlTemplates.fullStructure(content);
  content = htmlUtils.addOneBr(content, oneBrSymbol);
  content = htmlUtils.replaceTripleBrWithSingle(content);
  content = applyItalicTag(content, tok);

  return content;
}

export function formatMjml(editorContent: string, tok: SimpleTokens, tmpl: SimpleTemplates, oneBrSymbol?: string, preserveTextColors = false): string {
  let content = editorContent;
  content = content.replace(/<meta[^>]*>/gi, "");
  content = content.replace(/<br\b[^>]*>/gi, "<br>");
  content = flattenNestedFormatting(content);
  content = htmlUtils.mergeSimilarTags(content);
  content = italicLinks(content, tok);
  content = linksStyles(content, tok);
  content = htmlUtils.replaceAllEmojisAndSymbolsExcludingHTML(content);
  content = processStyles(content, tok, preserveTextColors);

  // Block Wrappers
  content = applyTemplate(content, /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/p>/gi, tmpl.mjmlTemplates.centerText);
  content = applyTemplate(content, /<h6[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h6>/gi, tmpl.mjmlTemplates.smallCenterText);
  content = applyTemplate(content, /<h6[^>]*>([\s\S]*?)<\/h6>/gi, tmpl.mjmlTemplates.smallText);
  content = applyTemplate(content, /<h1[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h1>/gi, (c) => tmpl.mjmlTemplates.centerHeadline(stripRedundantBoldWrapper(c)));
  content = applyTemplate(content, /<h1[^>]*>([\s\S]*?)<\/h1>/gi, (c) => tmpl.mjmlTemplates.headline(stripRedundantBoldWrapper(c)));
  content = applyTemplate(content, /<h4[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>([\s\S]*?)<\/h4>/gi, tmpl.mjmlTemplates.centerQuote);
  content = applyTemplate(content, /<h4[^>]*>([\s\S]*?)<\/h4>/gi, tmpl.mjmlTemplates.quote);
  content = applyTemplate(content, /<h5[^>]*>([\s\S]*?)<\/h5>/gi, tmpl.mjmlTemplates.button);

  content = htmlUtils.addBrAfterClosingP(content);
  content = content.replace(/\s*\[\[BR_SEP\]\]\s*/g, "\n<br><br>\n");
  content = htmlUtils.removeStylesFromLists(content);

  // Complex wrapping
  content = wrapTextInBlock(content, tmpl.mjmlTemplates.wrapImg, "mjml", tok);

  // More wrappers
  content = applyTemplate(content, /i-l-s([\s\S]*?)i-l-s-e/gi, tmpl.mjmlTemplates.leftSideImg);
  content = applyTemplate(content, /i-r-s([\s\S]*?)i-r-s-e/gi, tmpl.mjmlTemplates.rightSideImg);
  content = applyTemplate(content, /sign-i([\s\S]*?)sign-i-e/gi, tmpl.mjmlTemplates.signatureImg);
  content = applyTemplate(content, /ftr-s([\s\S]*?)ftr-e/gi, tmpl.mjmlTemplates.footerBlock);
  content = applyTemplate(content, /ftr-c([\s\S]*?)ftr-c-e/gi, tmpl.mjmlTemplates.footerCenterBlock);

  content = htmlUtils.cleanEmptyHtmlTags(content);
  content = tmpl.mjmlTemplates.fullStructure(content);
  content = htmlUtils.addOneBr(content, oneBrSymbol);
  content = htmlUtils.replaceTripleBrWithSingle(content);
  content = applyItalicTag(content, tok);

  return content;
}
