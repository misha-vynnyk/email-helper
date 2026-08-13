// The actual "substitute tree values into code-defined snippets" step — reads a validated
// DesignNode tree (desktop.json/mobile.json) from disk and renders it through the existing
// render/* snippets + masterShell wrapper. Node-only (fs), not imported by any browser bundle —
// this is the CLI/script counterpart of what FigmaImportPanel's "Build" button already does
// in-browser via the same renderDocumentContent/assembleDocument/validateDesignPair functions.
import * as fs from "fs";
import * as path from "path";

import type { DocumentFont } from "./render/masterShell";
import { assembleDocument } from "./render/masterShell";
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

export function buildTemplateFromFolder(folderPath: string, options: BuildFromFolderOptions): BuildFromFolderResult {
  const desktopRaw = fs.readFileSync(path.join(folderPath, "desktop.json"), "utf-8");
  const mobileRaw = fs.readFileSync(path.join(folderPath, "mobile.json"), "utf-8");

  const result = validateDesignPair(desktopRaw, mobileRaw);
  if (!result.valid || !result.desktopNodes || !result.mobileNodes) {
    const details = result.errors.map((e) => `  ${e.file}.json ${e.path}: ${e.message}`).join("\n");
    throw new Error(`Invalid desktop.json/mobile.json in ${folderPath}:\n${details}`);
  }

  const desktopHtml = assembleDocument(renderDocumentContent(result.desktopNodes, "desktop"), options);
  const mobileHtml = assembleDocument(renderDocumentContent(result.mobileNodes, "mobile"), options);
  return { desktopHtml, mobileHtml };
}
