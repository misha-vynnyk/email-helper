"use strict";
/**
 * Universal Storage Path Resolver
 * Cross-platform storage paths for Windows, macOS, and Linux
 * Supports environment variable overrides and localStorage configuration
 */
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
exports.getAppPaths = getAppPaths;
exports.ensureDir = ensureDir;
exports.getStoragePaths = getStoragePaths;
exports.getTemplateRoots = getTemplateRoots;
exports.initializeStorage = initializeStorage;
exports.getStorageInfo = getStorageInfo;
exports.isPathSafe = isPathSafe;
exports.expandTilde = expandTilde;
exports.toPlatformPath = toPlatformPath;
var os = require("os");
var path = require("path");
var fs = require("fs");
/**
 * Get OS-specific application directories
 * Follows platform conventions:
 * - macOS: ~/Library/Application Support/AppName
 * - Windows: %APPDATA%/AppName
 * - Linux: ~/.local/share/AppName (XDG Base Directory)
 */
function getAppPaths(appName) {
    if (appName === void 0) { appName = 'EmailBuilder'; }
    var homeDir = os.homedir();
    var platform = os.platform();
    var dataDir;
    var configDir;
    var cacheDir;
    var logsDir;
    switch (platform) {
        case 'darwin': // macOS
            dataDir = path.join(homeDir, 'Library', 'Application Support', appName);
            configDir = path.join(homeDir, 'Library', 'Preferences', appName);
            cacheDir = path.join(homeDir, 'Library', 'Caches', appName);
            logsDir = path.join(homeDir, 'Library', 'Logs', appName);
            break;
        case 'win32': // Windows
            var appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
            var localAppData = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');
            dataDir = path.join(appData, appName);
            configDir = path.join(appData, appName);
            cacheDir = path.join(localAppData, appName, 'Cache');
            logsDir = path.join(localAppData, appName, 'Logs');
            break;
        case 'linux': // Linux (XDG Base Directory spec)
        default:
            var xdgDataHome = process.env.XDG_DATA_HOME || path.join(homeDir, '.local', 'share');
            var xdgConfigHome = process.env.XDG_CONFIG_HOME || path.join(homeDir, '.config');
            var xdgCacheHome = process.env.XDG_CACHE_HOME || path.join(homeDir, '.cache');
            dataDir = path.join(xdgDataHome, appName);
            configDir = path.join(xdgConfigHome, appName);
            cacheDir = path.join(xdgCacheHome, appName);
            logsDir = path.join(dataDir, 'logs');
            break;
    }
    return {
        data: dataDir,
        config: configDir,
        cache: cacheDir,
        logs: logsDir,
    };
}
/**
 * Ensure directory exists (create if needed)
 */
function ensureDir(dirPath) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!fs.existsSync(dirPath)) return [3 /*break*/, 2];
                    return [4 /*yield*/, fs.promises.mkdir(dirPath, { recursive: true })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get universal storage paths for EmailBuilder
 * Supports environment variable overrides for custom locations
 */
function getStoragePaths() {
    var appPaths = getAppPaths('EmailBuilder');
    // Allow environment variable overrides
    // Falls back to default local paths for development
    var isDev = process.env.NODE_ENV !== 'production';
    var defaultDataDir = isDev ? path.join(process.cwd(), 'data') : appPaths.data;
    return {
        // Blocks storage
        customBlocks: process.env.CUSTOM_BLOCKS_DIR || path.join(defaultDataDir, 'blocks', 'custom'),
        blockFiles: process.env.BLOCK_FILES_DIR || path.join(defaultDataDir, 'blocks', 'files'),
        // Templates storage
        templates: process.env.TEMPLATES_DIR || path.join(defaultDataDir, 'templates'),
        templateMetadata: process.env.TEMPLATE_METADATA_PATH || path.join(appPaths.config, 'template-metadata.json'),
        // Images/assets
        images: process.env.IMAGES_DIR || path.join(defaultDataDir, 'images'),
        // User preferences
        userConfig: process.env.USER_CONFIG_PATH || path.join(appPaths.config, 'config.json'),
        // Logs
        logs: process.env.LOGS_DIR || appPaths.logs,
    };
}
/**
 * Get allowed template roots (cross-platform)
 * Supports both environment variables and localStorage configuration
 */
function getTemplateRoots() {
    var homeDir = os.homedir();
    var platform = os.platform();
    // Default roots based on OS
    var defaultRoots = [];
    switch (platform) {
        case 'darwin': // macOS
            defaultRoots.push(path.join(homeDir, 'Documents', 'EmailTemplates'), path.join(homeDir, 'Templates'));
            break;
        case 'win32': // Windows
            defaultRoots.push(path.join(homeDir, 'Documents', 'EmailTemplates'), path.join(homeDir, 'Templates'));
            break;
        case 'linux': // Linux
        default:
            defaultRoots.push(path.join(homeDir, 'Documents', 'EmailTemplates'), path.join(homeDir, 'templates'));
            break;
    }
    // Add from environment variable
    if (process.env.TEMPLATE_ROOTS) {
        var envRoots = process.env.TEMPLATE_ROOTS.split(',')
            .map(function (p) { return p.trim(); })
            .filter(function (p) { return p.length > 0; });
        return __spreadArray(__spreadArray([], envRoots, true), defaultRoots, true);
    }
    // Add storage paths
    var storagePaths = getStoragePaths();
    return __spreadArray([storagePaths.templates], defaultRoots, true);
}
/**
 * Initialize all storage directories
 * Creates necessary folders if they don't exist
 */
function initializeStorage() {
    return __awaiter(this, void 0, void 0, function () {
        var paths, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    paths = getStoragePaths();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    // Create all directories
                    return [4 /*yield*/, ensureDir(paths.customBlocks)];
                case 2:
                    // Create all directories
                    _a.sent();
                    return [4 /*yield*/, ensureDir(paths.blockFiles)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, ensureDir(paths.templates)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, ensureDir(paths.images)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, ensureDir(path.dirname(paths.templateMetadata))];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, ensureDir(path.dirname(paths.userConfig))];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, ensureDir(paths.logs)];
                case 8:
                    _a.sent();
                    console.log('📁 Storage initialized successfully:');
                    console.log("   Platform: ".concat(os.platform(), " (").concat(os.arch(), ")"));
                    console.log("   Blocks: ".concat(paths.customBlocks));
                    console.log("   Templates: ".concat(paths.templates));
                    console.log("   Config: ".concat(path.dirname(paths.userConfig)));
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _a.sent();
                    console.error('❌ Failed to initialize storage:', error_1);
                    throw error_1;
                case 10: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get storage info for frontend display
 */
function getStorageInfo() {
    return {
        platform: "".concat(os.platform(), " ").concat(os.arch()),
        paths: getStoragePaths(),
        templateRoots: getTemplateRoots(),
        homeDir: os.homedir(),
    };
}
/**
 * Validate if path is safe (prevent directory traversal)
 */
function isPathSafe(requestedPath, allowedRoots) {
    var normalizedPath = path.normalize(requestedPath);
    var absolutePath = path.isAbsolute(normalizedPath) ? normalizedPath : path.resolve(normalizedPath);
    // Check if path is within allowed roots
    return allowedRoots.some(function (root) {
        var normalizedRoot = path.normalize(path.resolve(root));
        return absolutePath.startsWith(normalizedRoot);
    });
}
/**
 * Expand tilde (~) to home directory (cross-platform)
 */
function expandTilde(filepath) {
    if (filepath.startsWith('~/') || filepath === '~') {
        return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
}
/**
 * Convert path to platform-specific format
 */
function toPlatformPath(filepath) {
    var expanded = expandTilde(filepath);
    // Node.js path.normalize handles platform differences automatically
    return path.normalize(expanded);
}
