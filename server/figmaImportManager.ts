/**
 * Figma Import Manager
 * Stage 1: read-only access to { description.md, desktop.json, mobile.json } in a
 * user-supplied folder. No write access, no addTemplate call — see
 * figma-to-html/FIGMA_TEMPLATE_IMPORT_PLAN.md ("Етап 1 — детальний план").
 */

import * as fs from "fs/promises";
import * as path from "path";
import { existsSync, statSync } from "fs";

import { getWorkspaceManager } from "./workspaceManager";

export interface FigmaImportFileResult {
  exists: boolean;
  content?: string;
}

export interface FigmaImportFolderResult {
  description: FigmaImportFileResult;
  desktopJson: FigmaImportFileResult;
  mobileJson: FigmaImportFileResult;
}

const FILE_NAMES = {
  description: "description.md",
  desktopJson: "desktop.json",
  mobileJson: "mobile.json",
} as const;

export class FigmaImportManager {
  // Same access model server/templateManager.ts's validatePath() uses:
  // WorkspaceManager.canAccess()/requestWorkspaceAccess() auto-registers any
  // non-blocked absolute path as a read-only workspace on first read — it does
  // NOT require a pre-configured root. This is deliberately NOT server/pathValidator.ts,
  // which is unused dead code with a hardcoded 2-folder whitelist that would wrongly
  // reject arbitrary Figma-export folders.
  private workspaceManager = getWorkspaceManager();

  async validateFolderPath(folderPath: string): Promise<{ valid: boolean; reason?: string }> {
    if (!path.isAbsolute(folderPath)) {
      return { valid: false, reason: "Folder path must be absolute" };
    }

    const normalized = path.normalize(folderPath);

    if (!existsSync(normalized)) {
      return { valid: false, reason: "Folder does not exist" };
    }

    if (!statSync(normalized).isDirectory()) {
      return { valid: false, reason: "Path is not a folder" };
    }

    let accessCheck = this.workspaceManager.canAccess(normalized, false);

    if (!accessCheck.allowed) {
      const result = await this.workspaceManager.requestWorkspaceAccess(normalized, "Figma Import Folder", true);
      if (!result.success) {
        return { valid: false, reason: result.error || "Access denied" };
      }
      accessCheck = this.workspaceManager.canAccess(normalized, false);
    }

    if (!accessCheck.allowed) {
      return { valid: false, reason: accessCheck.reason || "Access denied" };
    }

    return { valid: true };
  }

  async readFolder(folderPath: string): Promise<FigmaImportFolderResult> {
    const normalized = path.normalize(folderPath);

    const [description, desktopJson, mobileJson] = await Promise.all([
      this.readFile(path.join(normalized, FILE_NAMES.description)),
      this.readFile(path.join(normalized, FILE_NAMES.desktopJson)),
      this.readFile(path.join(normalized, FILE_NAMES.mobileJson)),
    ]);

    return { description, desktopJson, mobileJson };
  }

  private async readFile(filePath: string): Promise<FigmaImportFileResult> {
    if (!existsSync(filePath)) {
      return { exists: false };
    }
    const content = await fs.readFile(filePath, "utf-8");
    return { exists: true, content };
  }
}

let figmaImportManagerInstance: FigmaImportManager | null = null;

export function getFigmaImportManager(): FigmaImportManager {
  if (!figmaImportManagerInstance) {
    figmaImportManagerInstance = new FigmaImportManager();
  }
  return figmaImportManagerInstance;
}
