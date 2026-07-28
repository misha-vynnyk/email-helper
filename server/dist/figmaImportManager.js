"use strict";
/**
 * Figma Import Manager
 * Stage 1: read-only access to { description.md, desktop.json, mobile.json } in a
 * user-supplied folder. No write access, no addTemplate call — see
 * figma-to-html/FIGMA_TEMPLATE_IMPORT_PLAN.md ("Етап 1 — детальний план").
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FigmaImportManager = void 0;
exports.getFigmaImportManager = getFigmaImportManager;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const fs_1 = require("fs");
const workspaceManager_1 = require("./workspaceManager");
const FILE_NAMES = {
    description: "description.md",
    desktopJson: "desktop.json",
    mobileJson: "mobile.json",
};
class FigmaImportManager {
    constructor() {
        // Same access model server/templateManager.ts's validatePath() uses:
        // WorkspaceManager.canAccess()/requestWorkspaceAccess() auto-registers any
        // non-blocked absolute path as a read-only workspace on first read — it does
        // NOT require a pre-configured root. This is deliberately NOT server/pathValidator.ts,
        // which is unused dead code with a hardcoded 2-folder whitelist that would wrongly
        // reject arbitrary Figma-export folders.
        this.workspaceManager = (0, workspaceManager_1.getWorkspaceManager)();
    }
    async validateFolderPath(folderPath) {
        const normalized = path.normalize(path.resolve(folderPath));
        if (!(0, fs_1.existsSync)(normalized)) {
            return { valid: false, reason: "Folder does not exist" };
        }
        if (!(0, fs_1.statSync)(normalized).isDirectory()) {
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
    async readFolder(folderPath) {
        const normalized = path.normalize(path.resolve(folderPath));
        const [description, desktopJson, mobileJson] = await Promise.all([
            this.readFile(path.join(normalized, FILE_NAMES.description)),
            this.readFile(path.join(normalized, FILE_NAMES.desktopJson)),
            this.readFile(path.join(normalized, FILE_NAMES.mobileJson)),
        ]);
        return { description, desktopJson, mobileJson };
    }
    async readFile(filePath) {
        if (!(0, fs_1.existsSync)(filePath)) {
            return { exists: false };
        }
        const content = await fs.readFile(filePath, "utf-8");
        return { exists: true, content };
    }
}
exports.FigmaImportManager = FigmaImportManager;
let figmaImportManagerInstance = null;
function getFigmaImportManager() {
    if (!figmaImportManagerInstance) {
        figmaImportManagerInstance = new FigmaImportManager();
    }
    return figmaImportManagerInstance;
}
//# sourceMappingURL=figmaImportManager.js.map