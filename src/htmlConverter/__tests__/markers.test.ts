import { formatHtml } from "../formatter";
import { buildMarkers, getHighlightTokens } from "../markers";

describe("markers registry", () => {
  it("будує повний список маркерів", () => {
    const markers = buildMarkers("§");
    expect(markers.filter((m) => m.kind === "heading").map((m) => (m.kind === "heading" ? m.tag : ""))).toEqual(["h1", "h4", "h5", "h6"]);
    expect(markers.filter((m) => m.kind === "wrapper")).toHaveLength(5);
    expect(markers.find((m) => m.kind === "insert")).toMatchObject({ text: "§" });
  });

  it("getHighlightTokens містить усі wrapper-пари та oneBrSymbol", () => {
    expect(getHighlightTokens("§").sort()).toEqual(["§", "i-r-s", "i-r-s-e", "i-l-s", "i-l-s-e", "sign-i", "sign-i-e", "ftr-s", "ftr-e", "ftr-c", "ftr-c-e"].sort());
  });

  it("не включає порожній oneBrSymbol у токени", () => {
    expect(getHighlightTokens("")).not.toContain("");
  });

  // Drift-guard: якщо форматер перестане підтримувати маркер із реєстру,
  // літеральний токен залишиться в результаті конвертації — тест впаде.
  it("кожен wrapper-маркер реєстру споживається formatHtml", () => {
    for (const marker of buildMarkers("§")) {
      if (marker.kind !== "wrapper") continue;
      const output = formatHtml(`<p>${marker.open} text inside ${marker.close}</p>`, "§");
      expect(output).not.toContain(marker.open);
      expect(output).not.toContain(marker.close);
      // signatureImg свідомо ігнорує внутрішній контент (фіксований блок підпису)
      if (marker.open !== "sign-i") expect(output).toContain("text inside");
    }
  });

  it("heading-маркери споживаються formatHtml як теги", () => {
    for (const marker of buildMarkers("§")) {
      if (marker.kind !== "heading") continue;
      const output = formatHtml(`<${marker.tag}>Title here</${marker.tag}>`, "§");
      expect(output).not.toContain(`<${marker.tag}>`);
      expect(output).toContain("Title here");
    }
  });

  it("oneBrSymbol споживається formatHtml", () => {
    const output = formatHtml("<p>line one § line two</p>", "§");
    expect(output).not.toContain("§");
  });
});
