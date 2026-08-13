import { collectFonts } from "../collectFonts";
import type { DesignNode } from "../types";

describe("collectFonts", () => {
  it("collects distinct families and sorted weights from text nodes, including per-run overrides", () => {
    const nodes: DesignNode[] = [
      {
        id: "t1",
        type: "text",
        defaultStyle: { fontFamily: "Roboto", fontWeight: 400 },
        runs: [{ text: "a" }, { text: "b", fontWeight: 700 }],
      },
    ];

    expect(collectFonts(nodes)).toEqual([{ family: "Roboto", googleQuery: "Roboto:wght@400;700" }]);
  });

  it("collects from a button node's own fontFamily/fontWeight", () => {
    const nodes: DesignNode[] = [
      {
        id: "b1",
        type: "button",
        label: "Learn More",
        href: "urlhere",
        widthPx: 107,
        targetHeightPx: 33,
        fontFamily: "Roboto",
        fontSizePx: 16,
        fontWeight: 700,
        lineHeight: 1.3,
        paddingTopPx: 6,
        paddingBottomPx: 6,
        paddingLeftPx: 12,
        paddingRightPx: 12,
      },
    ];

    expect(collectFonts(nodes)).toEqual([{ family: "Roboto", googleQuery: "Roboto:wght@700" }]);
  });

  it("recurses into frame children and merges weights for the same family", () => {
    const nodes: DesignNode[] = [
      {
        id: "f1",
        type: "frame",
        direction: "column",
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        children: [
          { id: "t1", type: "text", defaultStyle: { fontFamily: "Montserrat", fontWeight: 600 }, runs: [{ text: "a" }] },
          { id: "t2", type: "text", defaultStyle: { fontFamily: "Montserrat", fontWeight: 400 }, runs: [{ text: "b" }] },
        ],
      },
    ];

    expect(collectFonts(nodes)).toEqual([{ family: "Montserrat", googleQuery: "Montserrat:wght@400;600" }]);
  });

  it("defaults to weight 400 when fontWeight is omitted", () => {
    const nodes: DesignNode[] = [
      { id: "t1", type: "text", defaultStyle: { fontFamily: "Roboto" }, runs: [{ text: "a" }] },
    ];
    expect(collectFonts(nodes)).toEqual([{ family: "Roboto", googleQuery: "Roboto:wght@400" }]);
  });

  it("returns an empty list for nodes with no fontFamily anywhere", () => {
    const nodes: DesignNode[] = [{ id: "d1", type: "divider", color: "#000" }];
    expect(collectFonts(nodes)).toEqual([]);
  });
});
