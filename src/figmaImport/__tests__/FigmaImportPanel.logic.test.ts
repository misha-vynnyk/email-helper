// Unit tests for the non-React logic in FigmaImportPanel.tsx (exported specifically for this).
// RTL tests on the component itself live in FigmaImportPanel.test.tsx.

// FigmaImportPanel.tsx -> useFigmaImportFolder -> api/endpoints/figmaImport -> api/client ->
// config/api & utils/logger, both of which read import.meta.env — ts-jest's CommonJS
// transform can't parse that (see UiSettingsTab.test.tsx for the same class of issue). None
// of that hook's real behavior is exercised here (this file never renders the component), so
// a stub matching its return shape sidesteps the whole chain instead of mocking it piecemeal.
jest.mock("../useFigmaImportFolder", () => ({
  useFigmaImportFolder: () => ({
    loading: false,
    error: null,
    description: undefined,
    descriptionExists: false,
    desktopRaw: undefined,
    mobileRaw: undefined,
    validation: null,
    load: jest.fn(),
    setFromFiles: jest.fn(),
    reset: jest.fn(),
  }),
}));

jest.mock("../render/renderNode", () => {
  const actual = jest.requireActual("../render/renderNode");
  return { ...actual, renderDocumentContent: jest.fn(actual.renderDocumentContent) };
});

import { buildDocuments, buildFromSingleTree, deriveTemplateTitle, slugifyFileName } from "../FigmaImportPanel";
import { renderDocumentContent } from "../render/renderNode";
import type { DesignNode } from "../types";

const mockedRenderDocumentContent = renderDocumentContent as jest.Mock;

const validDivider: DesignNode = { id: "divider-1", type: "divider", color: "#676767" };

afterEach(() => {
  mockedRenderDocumentContent.mockClear();
});

describe("slugifyFileName", () => {
  it("converts a normal title to dash-case", () => {
    expect(slugifyFileName("My Cool Template")).toBe("my-cool-template");
  });

  it("strips special characters", () => {
    expect(slugifyFileName("Q3 Report! (Final?) — v2.0")).toBe("q3-report-final-v2-0");
  });

  it("falls back to a default name for an empty or whitespace-only title", () => {
    expect(slugifyFileName("")).toBe("figma-import-preview");
    expect(slugifyFileName("   ")).toBe("figma-import-preview");
  });
});

describe("deriveTemplateTitle", () => {
  it("takes the last segment of a folder path, not the whole path", () => {
    expect(deriveTemplateTitle("/Users/me/figma-to-html/FamilyCenterOfWellness.com")).toBe("FamilyCenterOfWellness.com");
  });

  it("handles a trailing slash", () => {
    expect(deriveTemplateTitle("/Users/me/figma-to-html/FamilyCenterOfWellness.com/")).toBe("FamilyCenterOfWellness.com");
  });

  it("handles Windows-style backslash paths", () => {
    expect(deriveTemplateTitle("C:\\templates\\MyTemplate")).toBe("MyTemplate");
  });

  it("falls back to a default for an empty or whitespace-only path", () => {
    expect(deriveTemplateTitle("")).toBe("Figma Import Preview");
    expect(deriveTemplateTitle("   ")).toBe("Figma Import Preview");
  });
});

describe("buildFromSingleTree", () => {
  it("builds html and resolves the title for a valid tree with a manual title", () => {
    const result = buildFromSingleTree(JSON.stringify([validDivider]), "My Title");

    expect(result.html).toContain("border-bottom: 1px solid #676767;");
    expect(result.resolvedTitle).toBe("My Title");
    expect(result.errors).toBeUndefined();
  });

  it("returns validation errors and no html for invalid JSON", () => {
    const result = buildFromSingleTree("{not valid json", "My Title");

    expect(result.html).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it("prefers the title carried by the tree itself over the manual title field", () => {
    const result = buildFromSingleTree(JSON.stringify({ title: "From Tree", nodes: [validDivider] }), "Manual Title");
    expect(result.resolvedTitle).toBe("From Tree");
  });

  it("uses the manual title when the tree carries none", () => {
    const result = buildFromSingleTree(JSON.stringify([validDivider]), "Manual Title");
    expect(result.resolvedTitle).toBe("Manual Title");
  });

  it("falls back to a default title when neither the tree nor the manual field provide one", () => {
    const result = buildFromSingleTree(JSON.stringify([validDivider]), "   ");
    expect(result.resolvedTitle).toBe("Figma Import Preview");
  });

  it("returns an error instead of throwing when a schema-valid tree fails during render", () => {
    mockedRenderDocumentContent.mockImplementationOnce(() => {
      throw new Error("boom during render");
    });

    const result = buildFromSingleTree(JSON.stringify([validDivider]), "My Title");

    expect(result.error).toBe("boom during render");
    expect(result.html).toBeUndefined();
    // the title is still resolved even though the render step failed
    expect(result.resolvedTitle).toBe("My Title");
  });
});

describe("buildDocuments", () => {
  it("builds desktop and mobile html for valid node arrays", () => {
    const result = buildDocuments([validDivider], [validDivider], "My Title");
    expect(result.desktopHtml).toContain("border-bottom: 1px solid #676767;");
    expect(result.mobileHtml).toContain("border-bottom: 1px solid #676767;");
    expect(result.error).toBeUndefined();
  });

  it("returns an error instead of throwing when rendering fails", () => {
    mockedRenderDocumentContent.mockImplementationOnce(() => {
      throw new Error("boom during render");
    });

    const result = buildDocuments([validDivider], [validDivider], "My Title");

    expect(result.error).toBe("boom during render");
    expect(result.desktopHtml).toBeUndefined();
  });
});
