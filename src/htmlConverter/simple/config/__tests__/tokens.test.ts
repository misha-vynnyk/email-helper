import { STORAGE_PROVIDERS_CONFIG } from "../../../constants";
import { profile as alphaoneProfile } from "../../profiles/alphaone";
import { profile as defaultProfile } from "../../profiles/default";
import { profile as redProfile } from "../../profiles/red";
import { profile as tttProfile } from "../../profiles/ttt";
import { mergeSimpleTokens, tokens } from "../tokens";

describe("mergeSimpleTokens", () => {
  it("returns base tokens unchanged for an empty override", () => {
    expect(mergeSimpleTokens(tokens, {})).toEqual(tokens);
  });

  it("returns base tokens unchanged for the default profile (its override is {})", () => {
    expect(mergeSimpleTokens(tokens, defaultProfile)).toEqual(tokens);
  });

  it("overrides a top-level scalar field independently of everything else", () => {
    const merged = mergeSimpleTokens(tokens, { footerPaddingTopHtml: "99px" });
    expect(merged.footerPaddingTopHtml).toBe("99px");
    expect(merged.blockPaddingV).toBe(tokens.blockPaddingV);
    expect(merged.button).toEqual(tokens.button);
  });

  it("overrides one field of a nested group without touching sibling fields", () => {
    const merged = mergeSimpleTokens(tokens, { button: { height: "70" } });
    expect(merged.button.height).toBe("70");
    expect(merged.button.outerPadding).toBe(tokens.button.outerPadding);
    expect(merged.button.innerPadding).toBe(tokens.button.innerPadding);
    expect(merged.button.className).toBe(tokens.button.className);
  });

  it("overrides one color field independently of the other", () => {
    const merged = mergeSimpleTokens(tokens, { color: { link: "#123456" } });
    expect(merged.color.link).toBe("#123456");
    expect(merged.color.button).toBe(tokens.color.button);
  });

  it("replaces the fullStructure.spacer union wholesale when overridden (no partial merge across the two shapes)", () => {
    const merged = mergeSimpleTokens(tokens, {
      fullStructure: { spacer: { hasRows: false, verticalPaddingV: "1px" } },
    });
    expect(merged.fullStructure.spacer).toEqual({ hasRows: false, verticalPaddingV: "1px" });
    // Sibling fullStructure fields not touched by the override stay at base values
    expect(merged.fullStructure.tableClassName).toBe(tokens.fullStructure.tableClassName);
  });
});

describe("ttt profile", () => {
  it("fixes the TTT storage URL bug: resolves to providers.ttt.publicBaseUrl, not the buggy providers.publicBaseUrl", () => {
    const merged = mergeSimpleTokens(tokens, tttProfile);
    expect(merged.storageUrl).toBe(`${STORAGE_PROVIDERS_CONFIG.providers.ttt.publicBaseUrl}/`);
    expect(merged.storageUrl).not.toContain("undefined");
  });

  it("overrides exactly the documented set of fields (drift guard)", () => {
    expect(Object.keys(tttProfile).sort()).toEqual(
      [
        "storageUrl",
        "blockPaddingV",
        "rightSideImgHtmlPaddingV",
        "blockWrapTag",
        "headlineWrapTag",
        "button",
        "footerPaddingTopHtml",
        "footerPaddingBottomHtml",
        "signature",
        "wrapImg",
        "fullStructure",
        "detectItalicNativeLinks",
      ].sort(),
    );
  });
});

describe("alphaone profile", () => {
  it("resolves storageUrl from providers.alphaone.publicBaseUrl", () => {
    const merged = mergeSimpleTokens(tokens, alphaoneProfile);
    expect(merged.storageUrl).toBe(`${STORAGE_PROVIDERS_CONFIG.providers.alphaone.publicBaseUrl}/`);
  });

  it("keeps rightSideImgHtmlPaddingV at 15px, distinct from its own 16px blockPaddingV (preserves the original hand-written inconsistency)", () => {
    const merged = mergeSimpleTokens(tokens, alphaoneProfile);
    expect(merged.blockPaddingV).toBe("16px");
    expect(merged.rightSideImgHtmlPaddingV).toBe("15px");
  });

  it("has no spacer rows in fullStructure, unlike default/ttt", () => {
    const merged = mergeSimpleTokens(tokens, alphaoneProfile);
    expect(merged.fullStructure.spacer.hasRows).toBe(false);
  });

  it("overrides exactly the documented set of fields (drift guard)", () => {
    expect(Object.keys(alphaoneProfile).sort()).toEqual(
      [
        "fontFamily",
        "color",
        "storageUrl",
        "blockPaddingV",
        "rightSideImgHtmlPaddingV",
        "blockWrapTag",
        "headlineWrapTag",
        "headlineFontSize",
        "button",
        "footerPaddingTopHtml",
        "footerPaddingBottomHtml",
        "signature",
        "wrapImg",
        "fullStructure",
        "detectItalicNativeLinks",
      ].sort(),
    );
  });
});

describe("red profile", () => {
  it("uses a static storageUrl (no dynamic per-image naming)", () => {
    const merged = mergeSimpleTokens(tokens, redProfile);
    expect(merged.storageUrl).toBe("https://reagstr.com/");
  });

  it("keeps footerPaddingBottomHtml at 15px, distinct from its own 16px blockPaddingV", () => {
    const merged = mergeSimpleTokens(tokens, redProfile);
    expect(merged.blockPaddingV).toBe("16px");
    expect(merged.footerPaddingBottomHtml).toBe("15px");
  });

  it("uses span/strong wrap tags, unlike ttt/alphaone's div/b", () => {
    const merged = mergeSimpleTokens(tokens, redProfile);
    expect(merged.blockWrapTag).toBe("span");
    expect(merged.headlineWrapTag).toBe("strong");
  });

  it("has a distinct button radius (12px vs the shared 10px default)", () => {
    const merged = mergeSimpleTokens(tokens, redProfile);
    expect(merged.button.radius).toBe("12px");
    expect(tokens.button.radius).toBe("10px");
  });

  it("has a distinct wrapImg.fontSizeHtml (12px vs the shared 13px default)", () => {
    const merged = mergeSimpleTokens(tokens, redProfile);
    expect(merged.wrapImg.fontSizeHtml).toBe("12px");
    expect(tokens.wrapImg.fontSizeHtml).toBe("13px");
  });

  it("has dedicated spacer rows in fullStructure (like default/ttt, unlike alphaone)", () => {
    const merged = mergeSimpleTokens(tokens, redProfile);
    expect(merged.fullStructure.spacer.hasRows).toBe(true);
  });

  it("overrides exactly the documented set of fields (drift guard)", () => {
    expect(Object.keys(redProfile).sort()).toEqual(
      [
        "fontFamily",
        "color",
        "storageUrl",
        "blockPaddingV",
        "rightSideImgHtmlPaddingV",
        "blockWrapTag",
        "headlineWrapTag",
        "headlineFontSize",
        "button",
        "footerPaddingTopHtml",
        "footerPaddingBottomHtml",
        "signature",
        "wrapImg",
        "fullStructure",
        "detectItalicNativeLinks",
      ].sort(),
    );
  });
});

describe("default profile", () => {
  it("has no overrides at all", () => {
    expect(defaultProfile).toEqual({});
  });
});
