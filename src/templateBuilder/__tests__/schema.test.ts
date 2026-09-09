import { builderDocumentSchema, builderNodeSchema } from "../schema";
import { createDefaultButtonBlock, createDefaultSectionBlock, createDefaultTextBlock } from "../types";

describe("builderDocumentSchema", () => {
  it("parses a minimal valid document (one section containing one text leaf)", () => {
    const section = { ...createDefaultSectionBlock("s1", null), childIds: ["t1"] };
    const text = { ...createDefaultTextBlock("t1", "s1") };
    const doc = { nodes: [section, text] };

    const result = builderDocumentSchema.safeParse(doc);

    expect(result.success).toBe(true);
  });

  it("parses a document with a partial shell (only some fields set)", () => {
    const doc = { shell: { title: "My template" }, nodes: [] };

    const result = builderDocumentSchema.safeParse(doc);

    expect(result.success).toBe(true);
  });

  it("parses a document that omits shell entirely", () => {
    const result = builderDocumentSchema.safeParse({ nodes: [] });
    expect(result.success).toBe(true);
  });

  it("parses a section with a linearGradient fill", () => {
    const section = {
      ...createDefaultSectionBlock("s2", null),
      fill: { kind: "linearGradient", angleDeg: 180, stops: [{ color: "#DADAD8", position: 0 }, { color: "#F9F7F3", position: 0.0744 }] },
    };

    const result = builderDocumentSchema.safeParse({ nodes: [section] });

    expect(result.success).toBe(true);
  });

  it("parses a section with a plain string fill (unchanged solid-fill shape)", () => {
    const section = { ...createDefaultSectionBlock("s3", null), fill: "#fff9e9" };

    const result = builderDocumentSchema.safeParse({ nodes: [section] });

    expect(result.success).toBe(true);
  });

  it("parses a button with an icon", () => {
    const button = {
      ...createDefaultButtonBlock("b1", null),
      icon: { src: "https://storage.5th-elementagency.com/files/icon.png", alt: "Unsubscribe icon", widthPx: 10, gapPx: 8 },
    };

    const result = builderDocumentSchema.safeParse({ nodes: [button] });

    expect(result.success).toBe(true);
  });

  it("parses a button without an icon (icon stays optional)", () => {
    const button = createDefaultButtonBlock("b2", null);

    const result = builderDocumentSchema.safeParse({ nodes: [button] });

    expect(result.success).toBe(true);
  });

  it("rejects a section missing a required field (padding)", () => {
    const { padding: _padding, ...sectionWithoutPadding } = createDefaultSectionBlock("s4", null);

    const result = builderDocumentSchema.safeParse({ nodes: [sectionWithoutPadding] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "nodes.0.padding")).toBe(true);
    }
  });

  it("rejects a node with a field of the wrong type", () => {
    const text = { ...createDefaultTextBlock("t2", null), fontSizePx: "18px" };

    const result = builderDocumentSchema.safeParse({ nodes: [text] });

    expect(result.success).toBe(false);
  });

  it("rejects a node with an unknown (typo'd) field name", () => {
    const text = { ...createDefaultTextBlock("t3", null), colour: "#ff0000" };

    const result = builderDocumentSchema.safeParse({ nodes: [text] });

    expect(result.success).toBe(false);
  });

  it("rejects a node whose discriminant `type` value is misspelled", () => {
    const section = { ...createDefaultSectionBlock("s5", null), type: "secton" };

    const result = builderDocumentSchema.safeParse({ nodes: [section] });

    expect(result.success).toBe(false);
  });

  it("rejects a top-level document with an unknown field", () => {
    const result = builderDocumentSchema.safeParse({ nodes: [], extraField: true });
    expect(result.success).toBe(false);
  });

  it("rejects a gradient fill with fewer than 2 stops", () => {
    const section = { ...createDefaultSectionBlock("s6", null), fill: { kind: "linearGradient", angleDeg: 180, stops: [{ color: "#fff", position: 0 }] } };

    const result = builderDocumentSchema.safeParse({ nodes: [section] });

    expect(result.success).toBe(false);
  });
});

describe("builderNodeSchema", () => {
  it("accepts every node kind produced by the default factories", () => {
    const nodes = [
      createDefaultSectionBlock("s1", null),
      createDefaultTextBlock("t1", null),
      createDefaultButtonBlock("b1", null),
    ];
    for (const node of nodes) {
      expect(builderNodeSchema.safeParse(node).success).toBe(true);
    }
  });
});
