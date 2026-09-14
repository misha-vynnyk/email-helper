import { collectFonts } from "./collectFonts";
import { assembleDocument, assembleResponsiveDocument } from "./render/masterShell";
import { mergeDesignTrees } from "./render/mergeDesignTrees";
import { renderDocumentContent } from "./render/renderNode";
import type { DesignNode } from "./types";
import type { ValidationError } from "./validate";
import { validateDesignFile } from "./validate";

export interface BuildResult {
  desktopHtml?: string;
  mobileHtml?: string;
  error?: string;
}

export interface ResponsiveBuildResult {
  html?: string;
  diagnostics?: string[];
  error?: string;
}

export interface TreeBuildResult {
  html?: string;
  error?: string;
  errors?: ValidationError[];
  resolvedTitle?: string;
}

export function buildDocuments(desktopNodes: DesignNode[], mobileNodes: DesignNode[], title: string): BuildResult {
  try {
    const desktopHtml = assembleDocument(renderDocumentContent(desktopNodes, "desktop"), { title });
    const mobileHtml = assembleDocument(renderDocumentContent(mobileNodes, "mobile"), { title });
    return { desktopHtml, mobileHtml };
  } catch (buildError) {
    return { error: buildError instanceof Error ? buildError.message : String(buildError) };
  }
}

// Stage 3: one adaptive `.html` from the same validated desktop/mobile pair `buildDocuments`
// uses — see mergeDesignTrees.ts for the diff/merge algorithm. `diagnostics` lists every diff the
// merge couldn't express as a utility class (never a silent drop), surfaced in the UI below.
export function buildResponsiveDocuments(desktopNodes: DesignNode[], mobileNodes: DesignNode[], title: string): ResponsiveBuildResult {
  try {
    const { contentHtml, cssRules, diagnostics } = mergeDesignTrees(desktopNodes, mobileNodes);
    const html = assembleResponsiveDocument(contentHtml, { title, cssRules });
    return { html, diagnostics };
  } catch (buildError) {
    return { error: buildError instanceof Error ? buildError.message : String(buildError) };
  }
}

// The pair-flow's only source of a "template name" is whatever the user typed into the folder-path
// field — using that raw path as-is (as both the document `<title>` and the download filename)
// produced ugly, unreadable results (the whole path, slugified). Take just the last path segment
// instead; falls back the same way `folderPath` itself always did when empty.
export function deriveTemplateTitle(folderPath: string): string {
  const trimmed = folderPath.trim();
  if (!trimmed) return "Figma Import Preview";
  const segments = trimmed.split(/[/\\]+/).filter(Boolean);
  return segments[segments.length - 1] || "Figma Import Preview";
}

export function slugifyFileName(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "figma-import-preview";
}

export function downloadHtmlFile(html: string, title: string): void {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugifyFileName(title)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// Priority: title carried by the tree itself (wrapped `{ title, nodes }` format — set from the
// real Figma file/frame name when the tree was authored) > whatever the user typed manually >
// a last-resort default. The tree's own title wins over manual input so re-generating after
// pasting a different tree doesn't silently keep a stale, previously-typed title.
export function buildFromSingleTree(rawTree: string, manualTitle: string): TreeBuildResult {
  const validation = validateDesignFile(rawTree);
  if (!validation.valid || !validation.nodes) {
    return { errors: validation.errors };
  }

  const resolvedTitle = validation.title || manualTitle.trim() || "Figma Import Preview";

  try {
    const fonts = collectFonts(validation.nodes);
    const html = assembleDocument(renderDocumentContent(validation.nodes, "desktop"), { title: resolvedTitle, fonts });
    return { html, resolvedTitle };
  } catch (buildError) {
    return { error: buildError instanceof Error ? buildError.message : String(buildError), resolvedTitle };
  }
}
