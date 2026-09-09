/**
 * Figma Import Manager
 * Stage 1: read-only access to { description.md, desktop.json, mobile.json } in a
 * user-supplied folder. No write access, no addTemplate call — see
 * figma-to-html/FIGMA_TEMPLATE_IMPORT_PLAN.md ("Етап 1 — детальний план").
 */
export interface FigmaImportFileResult {
    exists: boolean;
    content?: string;
}
export interface FigmaImportFolderResult {
    description: FigmaImportFileResult;
    desktopJson: FigmaImportFileResult;
    mobileJson: FigmaImportFileResult;
}
export declare class FigmaImportManager {
    private workspaceManager;
    validateFolderPath(folderPath: string): Promise<{
        valid: boolean;
        reason?: string;
    }>;
    readFolder(folderPath: string): Promise<FigmaImportFolderResult>;
    private readFile;
}
export declare function getFigmaImportManager(): FigmaImportManager;
//# sourceMappingURL=figmaImportManager.d.ts.map