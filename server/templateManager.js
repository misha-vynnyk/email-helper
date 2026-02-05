"use strict";
/**
 * Template Manager
 * Manages HTML email templates from arbitrary file system locations
 * Cross-platform support (Windows, macOS, Linux)
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateManager = void 0;
exports.getTemplateManager = getTemplateManager;
var fs = require("fs/promises");
var path = require("path");
var fs_1 = require("fs");
var uuid_1 = require("uuid");
var storagePathResolver_1 = require("./utils/storagePathResolver");
var workspaceManager_1 = require("./workspaceManager");
/**
 * Template Manager Class
 */
var TemplateManager = /** @class */ (function () {
    function TemplateManager(config) {
        this.workspaceManager = (0, workspaceManager_1.getWorkspaceManager)();
        var paths = (0, storagePathResolver_1.getStoragePaths)();
        this.config = __assign({ metadataPath: paths.templateMetadata, 
            // Universal cross-platform allowed roots
            allowedRoots: (0, storagePathResolver_1.getTemplateRoots)(), maxFileSize: 5 * 1024 * 1024 }, config);
        this.metadata = {
            templates: [],
            lastUpdated: Date.now(),
        };
    }
    /**
     * Initialize - Load metadata from disk
     */
    TemplateManager.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dataDir, content, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        dataDir = path.dirname(this.config.metadataPath);
                        if (!!(0, fs_1.existsSync)(dataDir)) return [3 /*break*/, 2];
                        return [4 /*yield*/, fs.mkdir(dataDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!(0, fs_1.existsSync)(this.config.metadataPath)) return [3 /*break*/, 4];
                        return [4 /*yield*/, fs.readFile(this.config.metadataPath, "utf-8")];
                    case 3:
                        content = _a.sent();
                        this.metadata = JSON.parse(content);
                        return [3 /*break*/, 6];
                    case 4: 
                    // Create initial metadata file
                    return [4 /*yield*/, this.saveMetadata()];
                    case 5:
                        // Create initial metadata file
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        console.log("\u2705 TemplateManager initialized with ".concat(this.metadata.templates.length, " templates"));
                        return [3 /*break*/, 8];
                    case 7:
                        error_1 = _a.sent();
                        console.error("❌ Failed to initialize TemplateManager:", error_1);
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * List all templates
     */
    TemplateManager.prototype.listTemplates = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.metadata.templates];
            });
        });
    };
    /**
     * Get template by ID
     */
    TemplateManager.prototype.getTemplate = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var template;
            return __generator(this, function (_a) {
                template = this.metadata.templates.find(function (t) { return t.id === id; });
                return [2 /*return*/, template || null];
            });
        });
    };
    /**
     * Get template HTML content
     */
    TemplateManager.prototype.getTemplateContent = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var template, content, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTemplate(id)];
                    case 1:
                        template = _a.sent();
                        if (!template) {
                            throw new Error("Template not found: ".concat(id));
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        // Check if file still exists
                        if (!(0, fs_1.existsSync)(template.filePath)) {
                            throw new Error("Template file no longer exists: ".concat(template.filePath));
                        }
                        return [4 /*yield*/, fs.readFile(template.filePath, "utf-8")];
                    case 3:
                        content = _a.sent();
                        return [2 /*return*/, content];
                    case 4:
                        error_2 = _a.sent();
                        console.error("\u274C Failed to read template ".concat(id, ":"), error_2);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add new template
     */
    TemplateManager.prototype.addTemplate = function (filePath, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var expandedPath, normalizedPath_1, validation, stats, existing, template, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        expandedPath = (0, storagePathResolver_1.expandTilde)(filePath);
                        normalizedPath_1 = path.normalize(path.resolve(expandedPath));
                        return [4 /*yield*/, this.validatePath(expandedPath)];
                    case 1:
                        validation = _a.sent();
                        if (!validation.valid) {
                            throw new Error("Invalid path: ".concat(validation.reason));
                        }
                        stats = (0, fs_1.statSync)(normalizedPath_1);
                        existing = this.metadata.templates.find(function (t) { return t.filePath === normalizedPath_1; });
                        if (existing) {
                            throw new Error("Template already exists in library");
                        }
                        template = {
                            id: (0, uuid_1.v4)(),
                            filePath: normalizedPath_1,
                            name: metadata.name || path.basename(filePath, ".html"),
                            relativePath: metadata.relativePath, // Preserve folder structure
                            folderPath: metadata.folderPath, // Parent folder(s)
                            category: metadata.category || "Other",
                            tags: metadata.tags || [],
                            description: metadata.description,
                            thumbnail: metadata.thumbnail,
                            fileSize: stats.size,
                            lastModified: stats.mtimeMs,
                            createdAt: Date.now(),
                        };
                        // Add to metadata
                        this.metadata.templates.push(template);
                        this.metadata.lastUpdated = Date.now();
                        // Save
                        return [4 /*yield*/, this.saveMetadata()];
                    case 2:
                        // Save
                        _a.sent();
                        console.log("\u2705 Added template: ".concat(template.name, " (").concat(template.id, ")"));
                        return [2 /*return*/, template];
                    case 3:
                        error_3 = _a.sent();
                        console.error("❌ Failed to add template:", error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update template metadata
     */
    TemplateManager.prototype.updateTemplate = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var template, updated, index;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTemplate(id)];
                    case 1:
                        template = _a.sent();
                        if (!template) {
                            throw new Error("Template not found: ".concat(id));
                        }
                        updated = __assign(__assign(__assign({}, template), updates), { id: template.id, filePath: template.filePath });
                        index = this.metadata.templates.findIndex(function (t) { return t.id === id; });
                        this.metadata.templates[index] = updated;
                        this.metadata.lastUpdated = Date.now();
                        // Save
                        return [4 /*yield*/, this.saveMetadata()];
                    case 2:
                        // Save
                        _a.sent();
                        console.log("\u2705 Updated template: ".concat(updated.name));
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    /**
     * Remove template from library (doesn't delete file)
     */
    TemplateManager.prototype.removeTemplate = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var template;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTemplate(id)];
                    case 1:
                        template = _a.sent();
                        if (!template) {
                            throw new Error("Template not found: ".concat(id));
                        }
                        // Remove from metadata
                        this.metadata.templates = this.metadata.templates.filter(function (t) { return t.id !== id; });
                        this.metadata.lastUpdated = Date.now();
                        // Save
                        return [4 /*yield*/, this.saveMetadata()];
                    case 2:
                        // Save
                        _a.sent();
                        console.log("\u2705 Removed template: ".concat(template.name));
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up templates with missing files
     * Removes templates from database if their files no longer exist
     */
    TemplateManager.prototype.cleanupMissingFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var removed, validTemplates, _i, _a, template;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        removed = [];
                        validTemplates = [];
                        for (_i = 0, _a = this.metadata.templates; _i < _a.length; _i++) {
                            template = _a[_i];
                            try {
                                // Check if file exists
                                if (!(0, fs_1.existsSync)(template.filePath)) {
                                    console.log("\u26A0\uFE0F Removing template with missing file: ".concat(template.name, " (").concat(template.filePath, ")"));
                                    removed.push(template);
                                }
                                else {
                                    validTemplates.push(template);
                                }
                            }
                            catch (error) {
                                console.error("\u274C Error checking template ".concat(template.name, ":"), error);
                                // Keep template in list if we can't check
                                validTemplates.push(template);
                            }
                        }
                        if (!(removed.length > 0)) return [3 /*break*/, 2];
                        this.metadata.templates = validTemplates;
                        this.metadata.lastUpdated = Date.now();
                        return [4 /*yield*/, this.saveMetadata()];
                    case 1:
                        _b.sent();
                        console.log("\uD83E\uDDF9 Cleaned up ".concat(removed.length, " templates with missing files"));
                        return [3 /*break*/, 3];
                    case 2:
                        console.log("\u2705 All templates have valid files");
                        _b.label = 3;
                    case 3: return [2 /*return*/, {
                            removed: removed.length,
                            templates: removed,
                        }];
                }
            });
        });
    };
    /**
     * Import all .html files from a folder
     */
    TemplateManager.prototype.importFolder = function (folderPath_1) {
        return __awaiter(this, arguments, void 0, function (folderPath, options) {
            var expandedPath, normalizedPath, validation, imported, files, basePath, _i, files_1, filePath, normalizedFilePath, relativePath, folderParts, folderPath_2, template, error_4, error_5;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        expandedPath = (0, storagePathResolver_1.expandTilde)(folderPath);
                        normalizedPath = path.normalize(path.resolve(expandedPath));
                        return [4 /*yield*/, this.validatePath(expandedPath)];
                    case 1:
                        validation = _a.sent();
                        if (!validation.valid) {
                            throw new Error("Invalid folder path: ".concat(validation.reason));
                        }
                        imported = [];
                        return [4 /*yield*/, this.scanFolder(normalizedPath, options.recursive)];
                    case 2:
                        files = _a.sent();
                        basePath = normalizedPath;
                        _i = 0, files_1 = files;
                        _a.label = 3;
                    case 3:
                        if (!(_i < files_1.length)) return [3 /*break*/, 8];
                        filePath = files_1[_i];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        normalizedFilePath = path.normalize(filePath);
                        relativePath = path.relative(basePath, normalizedFilePath);
                        folderParts = path
                            .dirname(relativePath)
                            .split(path.sep)
                            .filter(function (p) { return p && p !== "."; });
                        folderPath_2 = folderParts.length > 0 ? folderParts.join(" / ") : undefined;
                        return [4 /*yield*/, this.addTemplate(filePath, {
                                name: path.basename(filePath, path.extname(filePath)),
                                category: options.category || "Other",
                                tags: options.tags || [],
                                relativePath: relativePath, // Store relative path
                                folderPath: folderPath_2,
                            })];
                    case 5:
                        template = _a.sent();
                        imported.push(template);
                        return [3 /*break*/, 7];
                    case 6:
                        error_4 = _a.sent();
                        console.warn("\u26A0\uFE0F Skipped ".concat(filePath, ":"), error_4);
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8:
                        console.log("\u2705 Imported ".concat(imported.length, " templates from ").concat(folderPath));
                        return [2 /*return*/, imported];
                    case 9:
                        error_5 = _a.sent();
                        console.error("❌ Failed to import folder:", error_5);
                        throw error_5;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sync template metadata with file system
     * Updates fileSize and lastModified if file changed
     */
    TemplateManager.prototype.syncTemplate = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var template, stats, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTemplate(id)];
                    case 1:
                        template = _a.sent();
                        if (!template) {
                            throw new Error("Template not found: ".concat(id));
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        if (!(0, fs_1.existsSync)(template.filePath)) {
                            throw new Error("File no longer exists");
                        }
                        stats = (0, fs_1.statSync)(template.filePath);
                        return [4 /*yield*/, this.updateTemplate(id, {
                                fileSize: stats.size,
                                lastModified: stats.mtimeMs,
                            })];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        error_6 = _a.sent();
                        console.error("\u274C Failed to sync template ".concat(id, ":"), error_6);
                        throw error_6;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate file path
     * macOS-specific security checks
     */
    TemplateManager.prototype.validatePath = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var expanded, normalized, stats, accessCheck, result, _a, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        expanded = (0, storagePathResolver_1.expandTilde)(filePath);
                        normalized = path.normalize(path.resolve(expanded));
                        // Check if path exists
                        if (!(0, fs_1.existsSync)(normalized)) {
                            return [2 /*return*/, { valid: false, reason: "Path does not exist" }];
                        }
                        stats = (0, fs_1.statSync)(normalized);
                        accessCheck = this.workspaceManager.canAccess(normalized, false);
                        if (!!accessCheck.allowed) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.workspaceManager.requestWorkspaceAccess(normalized, "Template Directory")];
                    case 1:
                        result = _b.sent();
                        if (result.success) {
                            // Re-check access after registration
                            accessCheck = this.workspaceManager.canAccess(normalized, false);
                        }
                        else {
                            return [2 /*return*/, { valid: false, reason: result.error || "Access denied" }];
                        }
                        _b.label = 2;
                    case 2:
                        if (!accessCheck.allowed) {
                            return [2 /*return*/, { valid: false, reason: accessCheck.reason || "Access denied" }];
                        }
                        // For folder import, accept directories
                        if (stats.isDirectory()) {
                            return [2 /*return*/, { valid: true }];
                        }
                        // For files, check extension
                        if (!normalized.toLowerCase().endsWith(".html") &&
                            !normalized.toLowerCase().endsWith(".htm")) {
                            return [2 /*return*/, { valid: false, reason: "Not an HTML file" }];
                        }
                        // Check file size
                        if (stats.size > this.config.maxFileSize) {
                            return [2 /*return*/, {
                                    valid: false,
                                    reason: "File too large (max ".concat(this.config.maxFileSize / 1024 / 1024, "MB)"),
                                }];
                        }
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, fs.access(normalized, fs.constants.R_OK)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        _a = _b.sent();
                        return [2 /*return*/, { valid: false, reason: "No read permission" }];
                    case 6: return [2 /*return*/, { valid: true }];
                    case 7:
                        error_7 = _b.sent();
                        return [2 /*return*/, { valid: false, reason: "Validation error: ".concat(error_7) }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get allowed roots (for settings UI)
     */
    TemplateManager.prototype.getAllowedRoots = function () {
        return __spreadArray([], this.config.allowedRoots, true);
    };
    /**
     * Add allowed root (for settings UI)
     */
    TemplateManager.prototype.addAllowedRoot = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var normalized;
            return __generator(this, function (_a) {
                normalized = path.normalize(path.resolve(rootPath));
                // Check if directory exists
                if (!(0, fs_1.existsSync)(normalized) || !(0, fs_1.statSync)(normalized).isDirectory()) {
                    throw new Error("Path must be an existing directory");
                }
                // Add to allowed roots
                if (!this.config.allowedRoots.includes(normalized)) {
                    this.config.allowedRoots.push(normalized);
                    console.log("\u2705 Added allowed root: ".concat(normalized));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Remove allowed root and clean up templates from that directory
     */
    TemplateManager.prototype.removeAllowedRoot = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var normalized, templatesToRemove, validTemplates, _i, _a, template;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        normalized = (0, storagePathResolver_1.expandTilde)(rootPath);
                        // Remove from allowed roots
                        this.config.allowedRoots = this.config.allowedRoots.filter(function (root) { return root !== normalized; });
                        templatesToRemove = [];
                        validTemplates = [];
                        for (_i = 0, _a = this.metadata.templates; _i < _a.length; _i++) {
                            template = _a[_i];
                            if (template.filePath.startsWith(normalized)) {
                                console.log("\uD83D\uDDD1\uFE0F Removing template from deleted directory: ".concat(template.name, " (").concat(template.filePath, ")"));
                                templatesToRemove.push(template);
                            }
                            else {
                                validTemplates.push(template);
                            }
                        }
                        if (!(templatesToRemove.length > 0)) return [3 /*break*/, 2];
                        this.metadata.templates = validTemplates;
                        this.metadata.lastUpdated = Date.now();
                        return [4 /*yield*/, this.saveMetadata()];
                    case 1:
                        _b.sent();
                        console.log("\uD83E\uDDF9 Removed ".concat(templatesToRemove.length, " templates from deleted directory: ").concat(normalized));
                        _b.label = 2;
                    case 2:
                        console.log("\u2705 Removed allowed root: ".concat(normalized));
                        return [2 /*return*/, {
                                removed: templatesToRemove.length,
                                templates: templatesToRemove,
                            }];
                }
            });
        });
    };
    /**
     * Private: Save metadata to disk
     */
    TemplateManager.prototype.saveMetadata = function () {
        return __awaiter(this, void 0, void 0, function () {
            var content, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        content = JSON.stringify(this.metadata, null, 2);
                        return [4 /*yield*/, fs.writeFile(this.config.metadataPath, content, "utf-8")];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        console.error("❌ Failed to save metadata:", error_8);
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Private: Scan folder for .html files
     */
    TemplateManager.prototype.scanFolder = function (folderPath_1) {
        return __awaiter(this, arguments, void 0, function (folderPath, recursive) {
            var htmlFiles, scan;
            var _this = this;
            if (recursive === void 0) { recursive = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        htmlFiles = [];
                        scan = function (dir) { return __awaiter(_this, void 0, void 0, function () {
                            var entries, _i, entries_1, entry, fullPath, ext;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fs.readdir(dir, { withFileTypes: true })];
                                    case 1:
                                        entries = _a.sent();
                                        _i = 0, entries_1 = entries;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < entries_1.length)) return [3 /*break*/, 6];
                                        entry = entries_1[_i];
                                        fullPath = path.join(dir, entry.name);
                                        if (!(entry.isDirectory() && recursive)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, scan(fullPath)];
                                    case 3:
                                        _a.sent();
                                        return [3 /*break*/, 5];
                                    case 4:
                                        if (entry.isFile()) {
                                            ext = path.extname(entry.name).toLowerCase();
                                            if (ext === ".html" || ext === ".htm") {
                                                htmlFiles.push(fullPath);
                                            }
                                        }
                                        _a.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, scan(folderPath)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, htmlFiles];
                }
            });
        });
    };
    /**
     * Get statistics
     */
    TemplateManager.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var byCategory, totalSize, _i, _a, template;
            return __generator(this, function (_b) {
                byCategory = {
                    Newsletter: 0,
                    Transactional: 0,
                    Marketing: 0,
                    Internal: 0,
                    Other: 0,
                };
                totalSize = 0;
                for (_i = 0, _a = this.metadata.templates; _i < _a.length; _i++) {
                    template = _a[_i];
                    byCategory[template.category]++;
                    totalSize += template.fileSize;
                }
                return [2 /*return*/, {
                        totalTemplates: this.metadata.templates.length,
                        byCategory: byCategory,
                        totalSize: totalSize,
                        allowedRoots: this.config.allowedRoots.length,
                    }];
            });
        });
    };
    return TemplateManager;
}());
exports.TemplateManager = TemplateManager;
// Singleton instance
var templateManagerInstance = null;
/**
 * Get TemplateManager singleton
 */
function getTemplateManager() {
    return __awaiter(this, void 0, void 0, function () {
        var error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!templateManagerInstance) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    templateManagerInstance = new TemplateManager();
                    return [4 /*yield*/, templateManagerInstance.init()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_9 = _a.sent();
                    console.error("❌ Failed to initialize TemplateManager:", error_9);
                    throw error_9;
                case 4: return [2 /*return*/, templateManagerInstance];
            }
        });
    });
}
