// The actual "substitute tree values into code-defined snippets" step — reads a validated
// DesignNode tree (desktop.json/mobile.json) from disk and renders it through the existing
// render/* snippets + masterShell wrapper. Node-only (fs), not imported by any browser bundle —
// this is the CLI/script counterpart of what FigmaImportPanel's "Build" button already does
// in-browser via the same renderDocumentContent/assembleDocument/validateDesignPair functions.
import * as fs from "fs";
import * as path from "path";

import type { DocumentFont } from "./render/masterShell";
import { assembleDocument, assembleResponsiveDocument } from "./render/masterShell";
import { mergeDesignTrees } from "./render/mergeDesignTrees";
import { renderDocumentContent } from "./render/renderNode";
import { validateDesignPair } from "./validate";

export interface BuildFromFolderOptions {
  title: string;
  fonts?: DocumentFont[];
}

export interface BuildFromFolderResult {
  desktopHtml: string;
  mobileHtml: string;
}

export interface BuildResponsiveFromFolderResult {
  html: string;
  diagnostics: string[];
}

function readJsonFile(folderPath: string, fileName: string): string {
  try {
    return fs.readFileSync(path.join(folderPath, fileName), "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Missing ${fileName} in ${folderPath}`);
    }
    throw error;
  }
}

function readValidatedPair(folderPath: string) {
  const desktopRaw = readJsonFile(folderPath, "desktop.json");
  const mobileRaw = readJsonFile(folderPath, "mobile.json");

  const result = validateDesignPair(desktopRaw, mobileRaw);
  if (!result.valid || !result.desktopNodes || !result.mobileNodes) {
    const details = result.errors.map((e) => `  ${e.file}.json ${e.path}: ${e.message}`).join("\n");
    throw new Error(`Invalid desktop.json/mobile.json in ${folderPath}:\n${details}`);
  }
  return { desktopNodes: result.desktopNodes, mobileNodes: result.mobileNodes };
}

export function buildTemplateFromFolder(folderPath: string, options: BuildFromFolderOptions): BuildFromFolderResult {
  const { desktopNodes, mobileNodes } = readValidatedPair(folderPath);
  const desktopHtml = assembleDocument(renderDocumentContent(desktopNodes, "desktop"), options);
  const mobileHtml = assembleDocument(renderDocumentContent(mobileNodes, "mobile"), options);
  return { desktopHtml, mobileHtml };
}

// Stage 3: one adaptive `.html` instead of the desktop/mobile pair above — see mergeDesignTrees.ts
// for the diff/merge algorithm and figma-import-status.md for the feature's real scope and known
// gaps. `diagnostics` surfaces every diff the merge couldn't represent as a utility class (color/
// fontFamily/letterSpacing/gap/fill/border/numeric-width diffs, and any structural divergence) —
// never a silent drop, always reported back to the caller.
export function buildResponsiveTemplateFromFolder(folderPath: string, options: BuildFromFolderOptions): BuildResponsiveFromFolderResult {
  const { desktopNodes, mobileNodes } = readValidatedPair(folderPath);
  const { contentHtml, cssRules, diagnostics } = mergeDesignTrees(desktopNodes, mobileNodes);
  const html = assembleResponsiveDocument(contentHtml, { ...options, cssRules });
  return { html, diagnostics };
}
