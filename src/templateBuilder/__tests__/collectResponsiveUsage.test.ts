import { collectResponsiveUsage } from "../render/collectResponsiveUsage";
import { createDefaultSectionBlock, createDefaultTextBlock, type BuilderNode } from "../types";
import { nodeMap } from "../testSupport/nodeMap";

describe("collectResponsiveUsage", () => {
  it("returns empty sets when nothing on the canvas opts into anything", () => {
    const nodes = nodeMap([createDefaultSectionBlock("s1", null)]);
    const usage = collectResponsiveUsage(nodes);
    expect(usage.classNames.size).toBe(0);
    expect(usage.readyMadeIds.size).toBe(0);
  });

  it("collects and dedupes classNames across every node in the map", () => {
    const section = { ...createDefaultSectionBlock("s1", null), responsiveClassNames: ["sm-hidden", "pt-8"] } as BuilderNode;
    const text = { ...createDefaultTextBlock("t1", "s1"), responsiveClassNames: ["pt-8", "xs-text-center"] } as BuilderNode;

    const usage = collectResponsiveUsage(nodeMap([section, text]));

    expect(usage.classNames).toEqual(new Set(["sm-hidden", "pt-8", "xs-text-center"]));
  });

  it("records a used ready-made block's definitionId and pulls in its declared utility-class dependencies", () => {
    const header = { id: "h1", parentId: "s1", type: "ready-made", definitionId: "header-adaptive", values: {} } as BuilderNode;

    const usage = collectResponsiveUsage(nodeMap([header]));

    expect(usage.readyMadeIds).toEqual(new Set(["header-adaptive"]));
    expect(usage.classNames).toEqual(new Set(["sm-hidden"])); // header-adaptive's usesUtilityClasses
  });
});
