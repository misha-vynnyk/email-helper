// Golden/integration test for the Stage 3 responsive assembler (mergeDesignTrees.ts +
// buildResponsiveTemplateFromFolder), run against the real desktop.json/mobile.json pair authored
// for figma-to-html/FamilyCenterOfWellness.com — the template that motivated building this
// feature (see figma-import-status.md's Stage 3 entry). Most of this template's real diffs are
// structural (header proportions, benefit-cards/ads-cards row↔stack, footer nav frame↔wrapping
// row, footer-main row↔stack), making it a good stress test beyond hand-written unit fixtures.
import * as fs from "fs";
import * as path from "path";

import { buildResponsiveTemplateFromFolder } from "../buildFromFolder";
import { mergeDesignTrees } from "../render/mergeDesignTrees";
import { validateDesignPair } from "../validate";

const folder = path.join(__dirname, "../../../figma-to-html/FamilyCenterOfWellness.com");

test("builds without throwing and produces a well-formed single document", () => {
  const { html } = buildResponsiveTemplateFromFolder(folder, { title: "FamilyCenterOfWellness.com" });
  expect(html).toContain("<!DOCTYPE html");
  expect(html).toContain("<title>FamilyCenterOfWellness.com</title>");
  expect(html.match(/<!DOCTYPE html/g)).toHaveLength(1); // exactly one document, not two concatenated
});

test("leaf-diffed sections (header date badge, logo text) render once with a matched override class, not doubled", () => {
  const { html } = buildResponsiveTemplateFromFolder(folder, { title: "t" });
  // header-date-badge's padding differs (60/8/60/8 desktop vs 40/8/40/8 mobile) — a leaf diff,
  // not a structural one (same shape both sides) — so "nov." appears exactly once, with a
  // matched pt-40/pb-40 override class attached, not rendered twice.
  expect(html.match(/nov\.<\/span>/g)).toHaveLength(1);
  expect(html).toContain('class="pt-40 pb-40"');
});

test("row↔stack sections (benefit-cards) merge into one adaptive row, not a toggled duplicate", () => {
  const { html } = buildResponsiveTemplateFromFolder(folder, { title: "t" });
  // benefit-cards is desktop direction:"row" / mobile direction:"column" with the SAME 3 card
  // ids on both sides — the adaptive row↔stack merge (mergeDesignTrees.ts's mergeRowToStack)
  // applies, so each card's headline renders exactly ONCE, wrapped in the inline-block/min-width
  // column shell, not doubled behind a .hidden/.block toggle.
  expect(html.match(/Vestibulum auctor ornare leo, non suscipit magna<\/span>/g)?.length).toBe(3); // 3 cards, once each
  expect(html).toContain('class="w-full"'); // base tier — see mergeRowToStack's doc comment
});

test("diagnostics report every unsupported diff, never silently", () => {
  const { diagnostics } = buildResponsiveTemplateFromFolder(folder, { title: "t" });
  expect(diagnostics.length).toBeGreaterThan(0);
  expect(diagnostics.some((d) => d.includes("letterSpacing"))).toBe(true);
  expect(diagnostics.some((d) => d.includes("structure diverges"))).toBe(true);
});

test("every class mergeDesignTrees resolves gets a real rule in the assembled <style> block", () => {
  // Checked against mergeDesignTrees's own `cssRules` return value rather than re-parsing every
  // `class="..."` attribute in the whole document: other renderers (e.g. RowNode's own column
  // markup) already emit their own independent, hardcoded classes unrelated to this feature's
  // utility-class system (no matching rule is expected or needed for those) — this test's real
  // invariant is narrower and about THIS module's own contract only.
  const desktopRaw = fs.readFileSync(path.join(folder, "desktop.json"), "utf-8");
  const mobileRaw = fs.readFileSync(path.join(folder, "mobile.json"), "utf-8");
  const validated = validateDesignPair(desktopRaw, mobileRaw);
  const { cssRules } = mergeDesignTrees(validated.desktopNodes!, validated.mobileNodes!);
  expect(cssRules.size).toBeGreaterThan(0);

  const { html } = buildResponsiveTemplateFromFolder(folder, { title: "t" });
  const styleBlockMatch = html.match(/@media screen and \(max-width: 602px\) \{([\s\S]*?)\n {4}\}/);
  expect(styleBlockMatch).not.toBeNull();
  const styleBlock = styleBlockMatch![1];
  cssRules.forEach((_rule, className) => {
    expect(styleBlock).toContain(`.${className} {`);
  });
});
