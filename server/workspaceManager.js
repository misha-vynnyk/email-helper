"use strict";
/**
 * Workspace Manager
 *
 * Cross-platform secure file system access management.
 * Manages allowed workspace directories with platform-specific security.
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
exports.WorkspaceManager = exports.AccessZone = void 0;
exports.getWorkspaceManager = getWorkspaceManager;
var fs = require("fs/promises");
var path = require("path");
var fs_1 = require("fs");
var os = require("os");
/**
 * Access Zones (security levels for workspaces)
 */
var AccessZone;
(function (AccessZone) {
    AccessZone["PROJECT_ONLY"] = "project";
    AccessZone["USER_WORKSPACES"] = "workspaces";
    AccessZone["RESTRICTED"] = "restricted";
})(AccessZone || (exports.AccessZone = AccessZone = {}));
/**
 * Platform-specific blocked paths
 */
var PLATFORM_BLOCKED_PATHS = {
    win32: [
        "C:\\Windows",
        "C:\\Program Files",
        "C:\\Program Files (x86)",
        "C:\\ProgramData",
        "C:\\System Volume Information",
    ],
    darwin: [
        "/System",
        "/Library",
        "/Applications",
        "/private/etc",
        "/private/var",
        "/usr",
        "/bin",
        "/sbin",
        "/cores",
        "/dev",
    ],
    linux: ["/etc", "/usr", "/bin", "/sbin", "/boot", "/root", "/sys", "/proc", "/dev"],
    // Other platforms use linux defaults
    aix: [],
    android: [],
    freebsd: [],
    haiku: [],
    openbsd: [],
    sunos: [],
    cygwin: [],
    netbsd: [],
};
/**
 * Security Policy presets
 */
var SECURITY_POLICIES = {
    strict: {
        maxWorkspaces: 1,
        maxFileSize: 1 * 1024 * 1024, // 1MB
        allowedExtensions: [".html", ".htm", ".ts"],
        requireConfirmation: true,
    },
    balanced: {
        maxWorkspaces: 10,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedExtensions: [".html", ".htm", ".ts", ".tsx", ".js", ".jsx"],
        requireConfirmation: false,
    },
    permissive: {
        maxWorkspaces: 50,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedExtensions: [".html", ".htm", ".ts", ".tsx", ".js", ".jsx", ".json"],
        requireConfirmation: false,
    },
};
/**
 * Workspace Manager Class
 */
var WorkspaceManager = /** @class */ (function () {
    function WorkspaceManager(securityLevel, projectRoot) {
        if (securityLevel === void 0) { securityLevel = "balanced"; }
        this.workspaces = new Map();
        this.blockedPaths = [];
        this.config = __assign({}, SECURITY_POLICIES[securityLevel]);
        this.projectRoot = projectRoot || path.resolve(__dirname, "../..");
        this.configFilePath = path.join(this.projectRoot, "server/data/.workspaces.json");
        // Load platform-specific blocked paths
        this.loadBlockedPaths();
        // Load persisted workspaces
        this.loadWorkspaces();
        // Always add project root as default workspace
        this.addProjectWorkspace();
    }
    /**
     * Load platform-specific blocked paths
     */
    WorkspaceManager.prototype.loadBlockedPaths = function () {
        var platform = process.platform;
        this.blockedPaths = PLATFORM_BLOCKED_PATHS[platform] || PLATFORM_BLOCKED_PATHS.linux;
        // Add user-specific paths to block list
        var homeDir = os.homedir();
        if (platform === "darwin") {
            this.blockedPaths.push(path.join(homeDir, "Library"));
            this.blockedPaths.push(path.join(homeDir, ".Trash"));
        }
        else if (platform === "win32") {
            if (process.env.APPDATA) {
                this.blockedPaths.push(process.env.APPDATA);
            }
            if (process.env.LOCALAPPDATA) {
                this.blockedPaths.push(process.env.LOCALAPPDATA);
            }
        }
        console.log("\uD83D\uDD12 Loaded ".concat(this.blockedPaths.length, " blocked paths for ").concat(platform));
    };
    /**
     * Add project root as default workspace
     */
    WorkspaceManager.prototype.addProjectWorkspace = function () {
        var id = "project-root";
        if (!this.workspaces.has(id)) {
            this.workspaces.set(id, {
                id: id,
                path: this.projectRoot,
                zone: AccessZone.PROJECT_ONLY,
                addedAt: Date.now(),
                accessCount: 0,
                lastAccess: Date.now(),
                label: "Project Root",
                readonly: false,
            });
        }
        // Also add src/blocks and data/blocks as default workspaces
        var srcBlocksId = "src-blocks";
        var srcBlocksPath = path.join(this.projectRoot, "src/blocks");
        if (!this.workspaces.has(srcBlocksId) && (0, fs_1.existsSync)(srcBlocksPath)) {
            this.workspaces.set(srcBlocksId, {
                id: srcBlocksId,
                path: srcBlocksPath,
                zone: AccessZone.PROJECT_ONLY,
                addedAt: Date.now(),
                accessCount: 0,
                lastAccess: Date.now(),
                label: "Source Blocks",
                readonly: false,
            });
        }
        var dataBlocksId = "data-blocks";
        var dataBlocksPath = path.join(this.projectRoot, "server/data/blocks/files");
        if (!this.workspaces.has(dataBlocksId) && (0, fs_1.existsSync)(dataBlocksPath)) {
            this.workspaces.set(dataBlocksId, {
                id: dataBlocksId,
                path: dataBlocksPath,
                zone: AccessZone.PROJECT_ONLY,
                addedAt: Date.now(),
                accessCount: 0,
                lastAccess: Date.now(),
                label: "Data Blocks",
                readonly: false,
            });
        }
    };
    /**
     * Load persisted workspaces from disk
     */
    WorkspaceManager.prototype.loadWorkspaces = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, parsed, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!(0, fs_1.existsSync)(this.configFilePath)) return [3 /*break*/, 2];
                        return [4 /*yield*/, fs.readFile(this.configFilePath, "utf8")];
                    case 1:
                        data = _a.sent();
                        parsed = JSON.parse(data);
                        if (parsed.workspaces && Array.isArray(parsed.workspaces)) {
                            parsed.workspaces.forEach(function (ws) {
                                // Verify workspace still exists
                                if ((0, fs_1.existsSync)(ws.path)) {
                                    _this.workspaces.set(ws.id, ws);
                                }
                            });
                            console.log("\uD83D\uDCC2 Loaded ".concat(this.workspaces.size, " workspaces"));
                        }
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.warn("Failed to load workspaces:", error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Save workspaces to disk
     */
    WorkspaceManager.prototype.saveWorkspaces = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configDir, data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        configDir = path.dirname(this.configFilePath);
                        if (!!(0, fs_1.existsSync)(configDir)) return [3 /*break*/, 2];
                        return [4 /*yield*/, fs.mkdir(configDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        data = {
                            version: 1,
                            workspaces: Array.from(this.workspaces.values()),
                            updatedAt: Date.now(),
                        };
                        return [4 /*yield*/, fs.writeFile(this.configFilePath, JSON.stringify(data, null, 2), "utf8")];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error("Failed to save workspaces:", error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Normalize path (cross-platform)
     */
    WorkspaceManager.prototype.normalizePath = function (filePath) {
        // Remove null bytes and control characters
        filePath = filePath.replace(/\0/g, "");
        filePath = filePath.replace(/[\x00-\x1F\x7F]/g, "");
        // Handle home directory expansion
        if (filePath.startsWith("~")) {
            filePath = path.join(os.homedir(), filePath.slice(1));
        }
        // Resolve to absolute normalized path
        return path.normalize(path.resolve(filePath));
    };
    /**
     * Check if path is blocked (system directory)
     */
    WorkspaceManager.prototype.isBlocked = function (filePath) {
        var _this = this;
        var normalized = this.normalizePath(filePath);
        return this.blockedPaths.some(function (blocked) {
            var normalizedBlocked = _this.normalizePath(blocked);
            return normalized.startsWith(normalizedBlocked);
        });
    };
    /**
     * Check if path contains traversal attempts
     */
    WorkspaceManager.prototype.hasTraversal = function (filePath) {
        // Check for ../ or ..\\ patterns
        return /\.\.[/\\]/.test(filePath);
    };
    /**
     * Validate directory path
     */
    WorkspaceManager.prototype.validateDirectory = function (dirPath) {
        return __awaiter(this, void 0, void 0, function () {
            var normalized, stats;
            return __generator(this, function (_a) {
                try {
                    normalized = this.normalizePath(dirPath);
                    // Check for traversal
                    if (this.hasTraversal(dirPath)) {
                        return [2 /*return*/, { valid: false, reason: "Path traversal detected" }];
                    }
                    // Check if blocked
                    if (this.isBlocked(normalized)) {
                        return [2 /*return*/, { valid: false, reason: "System directory is blocked for security" }];
                    }
                    // If path exists, verify it's a directory
                    if ((0, fs_1.existsSync)(normalized)) {
                        stats = (0, fs_1.statSync)(normalized);
                        if (!stats.isDirectory()) {
                            return [2 /*return*/, { valid: false, reason: "Path is not a directory" }];
                        }
                    }
                    // Note: Allow non-existent paths - they will be created if needed
                    return [2 /*return*/, { valid: true }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            valid: false,
                            reason: "Validation error: ".concat(error instanceof Error ? error.message : "Unknown"),
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Determine access zone for a path
     */
    WorkspaceManager.prototype.determineAccessZone = function (dirPath) {
        var normalized = this.normalizePath(dirPath);
        // Project folder = highest security
        if (normalized === this.projectRoot || normalized.startsWith(this.projectRoot + path.sep)) {
            return AccessZone.PROJECT_ONLY;
        }
        // Check if in common safe locations
        var homeDir = os.homedir();
        var safePaths = [
            path.join(homeDir, "Documents"),
            path.join(homeDir, "Desktop"),
            path.join(homeDir, "Projects"),
            path.join(homeDir, "Workspace"),
        ];
        var isSafe = safePaths.some(function (safe) { return normalized.startsWith(safe); });
        if (isSafe) {
            return AccessZone.USER_WORKSPACES;
        }
        // Everything else needs extra scrutiny
        return AccessZone.RESTRICTED;
    };
    /**
     * Request access to a new workspace
     */
    WorkspaceManager.prototype.requestWorkspaceAccess = function (dirPath_1, label_1) {
        return __awaiter(this, arguments, void 0, function (dirPath, label, readonly) {
            var validation, normalized_1, existing, zone, id, workspace, error_3;
            if (readonly === void 0) { readonly = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Check workspace limit
                        if (this.workspaces.size >= this.config.maxWorkspaces) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Maximum ".concat(this.config.maxWorkspaces, " workspaces allowed"),
                                }];
                        }
                        return [4 /*yield*/, this.validateDirectory(dirPath)];
                    case 1:
                        validation = _a.sent();
                        if (!validation.valid) {
                            return [2 /*return*/, { success: false, error: validation.reason }];
                        }
                        normalized_1 = this.normalizePath(dirPath);
                        existing = Array.from(this.workspaces.values()).find(function (ws) { return ws.path === normalized_1; });
                        if (existing) {
                            return [2 /*return*/, { success: true, workspaceId: existing.id, zone: existing.zone }];
                        }
                        zone = this.determineAccessZone(normalized_1);
                        // For RESTRICTED zone, add extra warning in logs
                        if (zone === AccessZone.RESTRICTED) {
                            console.warn("\u26A0\uFE0F  Adding RESTRICTED zone workspace: ".concat(normalized_1));
                        }
                        id = "ws-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
                        workspace = {
                            id: id,
                            path: normalized_1,
                            zone: zone,
                            addedAt: Date.now(),
                            accessCount: 0,
                            lastAccess: Date.now(),
                            label: label || path.basename(normalized_1),
                            readonly: readonly,
                        };
                        this.workspaces.set(id, workspace);
                        return [4 /*yield*/, this.saveWorkspaces()];
                    case 2:
                        _a.sent();
                        console.log("\u2705 Added workspace [".concat(zone, "]: ").concat(normalized_1));
                        return [2 /*return*/, { success: true, workspaceId: id, zone: zone }];
                    case 3:
                        error_3 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_3 instanceof Error ? error_3.message : "Unknown error",
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Remove workspace
     */
    WorkspaceManager.prototype.removeWorkspace = function (workspaceId) {
        return __awaiter(this, void 0, void 0, function () {
            var removed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Don't allow removing project root
                        if (workspaceId === "project-root") {
                            return [2 /*return*/, false];
                        }
                        removed = this.workspaces.delete(workspaceId);
                        if (!removed) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.saveWorkspaces()];
                    case 1:
                        _a.sent();
                        console.log("\uD83D\uDDD1\uFE0F  Removed workspace: ".concat(workspaceId));
                        _a.label = 2;
                    case 2: return [2 /*return*/, removed];
                }
            });
        });
    };
    /**
     * Check if file path can be accessed
     */
    WorkspaceManager.prototype.canAccess = function (filePath, requireWrite) {
        if (requireWrite === void 0) { requireWrite = false; }
        try {
            var normalized = this.normalizePath(filePath);
            // Check for traversal
            if (this.hasTraversal(filePath)) {
                return { allowed: false, reason: "Path traversal detected" };
            }
            // Blocked paths have priority
            if (this.isBlocked(normalized)) {
                return { allowed: false, reason: "System directory blocked" };
            }
            // Check if within any workspace
            for (var _i = 0, _a = this.workspaces.values(); _i < _a.length; _i++) {
                var workspace = _a[_i];
                if (normalized.startsWith(workspace.path)) {
                    // Check readonly restriction
                    if (requireWrite && workspace.readonly) {
                        return {
                            allowed: false,
                            reason: "Workspace is read-only",
                            workspace: workspace.id,
                            zone: workspace.zone,
                        };
                    }
                    return {
                        allowed: true,
                        workspace: workspace.id,
                        zone: workspace.zone,
                    };
                }
            }
            return { allowed: false, reason: "Path not in any allowed workspace" };
        }
        catch (error) {
            return {
                allowed: false,
                reason: error instanceof Error ? error.message : "Unknown error",
            };
        }
    };
    /**
     * Track file access
     */
    WorkspaceManager.prototype.trackAccess = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var access, workspace;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        access = this.canAccess(filePath);
                        if (!(access.allowed && access.workspace)) return [3 /*break*/, 2];
                        workspace = this.workspaces.get(access.workspace);
                        if (!workspace) return [3 /*break*/, 2];
                        workspace.accessCount++;
                        workspace.lastAccess = Date.now();
                        return [4 /*yield*/, this.saveWorkspaces()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all workspaces
     */
    WorkspaceManager.prototype.getWorkspaces = function () {
        return Array.from(this.workspaces.values());
    };
    /**
     * Get workspaces by zone
     */
    WorkspaceManager.prototype.getWorkspacesByZone = function (zone) {
        return Array.from(this.workspaces.values()).filter(function (ws) { return ws.zone === zone; });
    };
    /**
     * Set workspace readonly status
     */
    WorkspaceManager.prototype.setWorkspaceReadonly = function (workspaceId, readonly) {
        return __awaiter(this, void 0, void 0, function () {
            var workspace;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        workspace = this.workspaces.get(workspaceId);
                        if (!workspace)
                            return [2 /*return*/, false];
                        workspace.readonly = readonly;
                        return [4 /*yield*/, this.saveWorkspaces()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Get workspace by ID
     */
    WorkspaceManager.prototype.getWorkspace = function (id) {
        return this.workspaces.get(id);
    };
    /**
     * Get blocked paths
     */
    WorkspaceManager.prototype.getBlockedPaths = function () {
        return __spreadArray([], this.blockedPaths, true);
    };
    /**
     * Get security config
     */
    WorkspaceManager.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    /**
     * Validate file extension
     */
    WorkspaceManager.prototype.isAllowedExtension = function (filePath) {
        var ext = path.extname(filePath).toLowerCase();
        return this.config.allowedExtensions.includes(ext);
    };
    /**
     * Check file size
     */
    WorkspaceManager.prototype.validateFileSize = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var stats, maxMB;
            return __generator(this, function (_a) {
                try {
                    if (!(0, fs_1.existsSync)(filePath)) {
                        return [2 /*return*/, { valid: false, reason: "File does not exist" }];
                    }
                    stats = (0, fs_1.statSync)(filePath);
                    if (stats.size > this.config.maxFileSize) {
                        maxMB = (this.config.maxFileSize / 1024 / 1024).toFixed(1);
                        return [2 /*return*/, {
                                valid: false,
                                size: stats.size,
                                reason: "File too large (max ".concat(maxMB, "MB)"),
                            }];
                    }
                    return [2 /*return*/, { valid: true, size: stats.size }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            valid: false,
                            reason: error instanceof Error ? error.message : "Unknown error",
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    return WorkspaceManager;
}());
exports.WorkspaceManager = WorkspaceManager;
/**
 * Singleton instance
 */
var workspaceManagerInstance = null;
/**
 * Get WorkspaceManager singleton
 */
function getWorkspaceManager() {
    if (!workspaceManagerInstance) {
        workspaceManagerInstance = new WorkspaceManager("balanced");
    }
    return workspaceManagerInstance;
}
