import { designFileSchema } from "../../schema";
import type { CardListNode, SponsoredLinkCard, TextNode } from "../../types";
import { renderCardList } from "../renderCardList";
import { renderText } from "../renderText";

// Values taken literally from the real "Sponsored Content" card list in
// figma-to-html/KitchenTableInsight.com/desktop.json — the case that motivated this
// fixed-structure card mechanism (see the CardListNode doc comment in types.ts).
function titleText(text: string): TextNode {
  return {
    id: `${text}-title`,
    type: "text",
    defaultStyle: { fontFamily: "Montserrat", fontWeight: 700, fontSizePx: 16, color: "#1D77D7", underline: true, href: "urlhere" },
    runs: [{ text: `• ${text}` }],
    padding: { top: 0, bottom: 0 },
  };
}

function secondaryText(): TextNode {
  return {
    id: "partner",
    type: "text",
    defaultStyle: { fontFamily: "Montserrat", fontWeight: 300, fontSizePx: 16, color: "#ADADAD" },
    runs: [{ text: "(partner's name)" }],
    padding: { top: 0, bottom: 0 },
  };
}

function card(id: string, name?: string): SponsoredLinkCard {
  return {
    id,
    name,
    padding: { top: 0, right: 8, bottom: 0, left: 0 },
    title: titleText(id),
    secondary: secondaryText(),
  };
}

const threeCardList: CardListNode = {
  id: "sponsored-cards",
  type: "cardList",
  variant: "sponsoredLink",
  gap: 16,
  cards: [card("card-1"), card("card-2"), card("card-3")],
};

describe("renderCardList", () => {
  it("renders the 3-card sponsoredLink list", () => {
    expect(renderCardList(threeCardList)).toMatchSnapshot();
  });

  it("renders each card's title/secondary through the existing renderText, unmodified", () => {
    const singleCard = card("only-card");
    const node: CardListNode = { id: "single", type: "cardList", variant: "sponsoredLink", cards: [singleCard] };
    const html = renderCardList(node);
    expect(html).toContain(renderText(singleCard.title));
    expect(html).toContain(renderText(singleCard.secondary));
  });

  it("folds gap into every non-last card's own bottom padding, none on the last", () => {
    const html = renderCardList(threeCardList);
    // 3 cards, gap between each of the 2 non-last pairs => exactly 2 gap declarations
    expect(html.match(/padding-bottom: 16px;/g)).toHaveLength(2);
  });

  it("folds a parent's extraBottomGapPx into the LAST card only", () => {
    const html = renderCardList(threeCardList, 24);
    expect(html.match(/padding-bottom: 24px;/g)).toHaveLength(1);
  });

  it("wraps a named card in its own <!-- Name --> comment, independent of siblings", () => {
    const node: CardListNode = {
      id: "named-cards",
      type: "cardList",
      variant: "sponsoredLink",
      cards: [card("c1", "FirstCard"), card("c2", "SecondCard")],
    };
    const html = renderCardList(node);
    expect(html).toContain("<!-- FirstCard -->");
    expect(html).toContain("<!-- FirstCard end -->");
    expect(html).toContain("<!-- SecondCard -->");
    expect(html).toContain("<!-- SecondCard end -->");
  });

  it("adds no comment for a card without a name", () => {
    const node: CardListNode = { id: "unnamed-cards", type: "cardList", variant: "sponsoredLink", cards: [card("c1")] };
    expect(renderCardList(node)).not.toContain("<!--");
  });

  it("parses cleanly through designFileSchema", () => {
    const result = designFileSchema.safeParse([threeCardList]);
    expect(result.success).toBe(true);
  });
});
