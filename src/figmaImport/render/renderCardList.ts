import type { CardListNode, SponsoredLinkCard } from "../types";
import { wrapNameComment } from "./cssUtils";
import { renderText } from "./renderText";

// Full longhand, zero sides omitted — same convention as insetPadding in renderNode.ts (some
// email clients have documented bugs with the multi-value padding shorthand per side).
function cardPadding(card: SponsoredLinkCard, extraBottomGapPx: number): string {
  const bottom = card.padding.bottom + extraBottomGapPx;
  return [
    card.padding.top ? `padding-top: ${card.padding.top}px;` : "",
    card.padding.right ? `padding-right: ${card.padding.right}px;` : "",
    bottom ? `padding-bottom: ${bottom}px;` : "",
    card.padding.left ? `padding-left: ${card.padding.left}px;` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// Fixed structure: a padded `<td>` (the card's own literal inset) wraps a plain content
// `<table>` holding exactly `title` then `secondary`, each rendered through the existing
// `renderText()` — no duplicated style/href logic, and no freedom for a card to carry a
// different number/kind of children than this. `title`/`secondary` are plain TextNodes, so
// `href` (conventionally the "urlhere" placeholder, per project convention) lives on the
// title's own run, same as everywhere else — never a bespoke field on the card itself.
function renderSponsoredLinkCard(card: SponsoredLinkCard, extraBottomGapPx: number): string {
  const html =
    `<tr><td style="${cardPadding(card, extraBottomGapPx)} margin: 0;">` +
    `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">` +
    `${renderText(card.title)}${renderText(card.secondary)}` +
    `</table></td></tr>`;
  return wrapNameComment(card.name, html);
}

// `gap` between cards is folded into each non-last card's own bottom padding — the exact
// same technique renderColumnContent uses for a frame's self-wrapping children (see the
// CORRECTION comment in renderNode.ts). `extraBottomGapPx` (folded in from whatever parent
// frame this cardList itself sits in) lands on the LAST card only, matching how every other
// self-wrapping type's own outermost bottom padding receives it.
export function renderCardList(node: CardListNode, extraBottomGapPx = 0): string {
  const lastIndex = node.cards.length - 1;
  return node.cards
    .map((card, index) => {
      const isLast = index === lastIndex;
      const gap = isLast ? extraBottomGapPx : (node.gap ?? 0);
      return renderSponsoredLinkCard(card, gap);
    })
    .join("");
}
