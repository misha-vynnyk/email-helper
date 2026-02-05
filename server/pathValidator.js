"use strict";
/**
 * Path Validator
 * macOS-specific security for file system access
 *
 * Validates file paths to prevent unauthorized access to system directories
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
exports.PathValidator = void 0;
exports.getPathValidator = getPathValidator;
exports.validatePath = validatePath;
exports.isSafePath = isSafePath;
var path = require("path");
var fs_1 = require("fs");
var os = require("os");
/**
 * Path Validator Class
 */
var PathValidator = /** @class */ (function () {
    function PathValidator(config) {
        var homeDir = os.homedir();
        // Default configuration for macOS
        this.config = __assign({ 
            // Whitelist: User can access these directories
            // RESTRICTED: Only specific folders for security
            allowedRoots: [
                path.join(homeDir, 'Templates'),
                path.join(homeDir, 'Documents', 'EPC-Network', 'email-devs', 'Templates'), // User's work templates
            ], 
            // Blacklist: System directories that should never be accessed
            blockedPaths: [
                '/System', // macOS system files
                '/Library', // System library
                '/private/etc', // System config
                '/private/var', // System var
                '/usr', // Unix system resources
                '/bin', // System binaries
                '/sbin', // System binaries
                '/Applications', // Apps (prevent reading app bundles)
                '/Volumes', // Mounted volumes (security risk)
                homeDir + '/Library', // User library (sensitive)
                homeDir + '/.Trash', // Trash folder
            ], 
            // Allowed file extensions
            allowedExtensions: ['.html', '.htm'], 
            // Maximum file size (5 MB)
            maxFileSize: 5 * 1024 * 1024, 
            // Allow directories (for folder scanning)
            allowDirectories: true }, config);
    }
    /**
     * Validate a file or directory path
     */
    PathValidator.prototype.validate = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var normalized, stats;
            return __generator(this, function (_a) {
                try {
                    normalized = this.normalizePath(filePath);
                    // Step 2: Check if path exists
                    if (!(0, fs_1.existsSync)(normalized)) {
                        return [2 /*return*/, {
                                valid: false,
                                reason: 'Path does not exist',
                            }];
                    }
                    stats = (0, fs_1.statSync)(normalized);
                    // Step 4: Check if it's a directory
                    if (stats.isDirectory()) {
                        return [2 /*return*/, this.validateDirectory(normalized)];
                    }
                    // Step 5: Validate file
                    return [2 /*return*/, this.validateFile(normalized, stats)];
                }
                catch (error) {
                    return [2 /*return*/, {
                            valid: false,
                            reason: "Validation error: ".concat(error instanceof Error ? error.message : 'Unknown error'),
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate directory path
     */
    PathValidator.prototype.validateDirectory = function (dirPath) {
        if (!this.config.allowDirectories) {
            return {
                valid: false,
                reason: 'Directories are not allowed',
            };
        }
        // Check if in allowed roots
        if (!this.isInAllowedRoots(dirPath)) {
            return {
                valid: false,
                reason: 'Directory not in allowed roots',
            };
        }
        // Check if blocked
        if (this.isBlocked(dirPath)) {
            return {
                valid: false,
                reason: 'System directory blocked for security',
            };
        }
        return {
            valid: true,
            normalizedPath: dirPath,
        };
    };
    /**
     * Validate file path
     */
    PathValidator.prototype.validateFile = function (filePath, stats) {
        // Check extension
        var ext = path.extname(filePath).toLowerCase();
        if (!this.config.allowedExtensions.includes(ext)) {
            return {
                valid: false,
                reason: "Invalid file extension. Allowed: ".concat(this.config.allowedExtensions.join(', ')),
            };
        }
        // Check if in allowed roots
        if (!this.isInAllowedRoots(filePath)) {
            return {
                valid: false,
                reason: 'File not in allowed roots',
            };
        }
        // Check if blocked
        if (this.isBlocked(filePath)) {
            return {
                valid: false,
                reason: 'System directory blocked for security',
            };
        }
        // Check file size
        if (stats.size > this.config.maxFileSize) {
            var maxMB = this.config.maxFileSize / 1024 / 1024;
            return {
                valid: false,
                reason: "File too large (max ".concat(maxMB.toFixed(1), " MB)"),
            };
        }
        // Check read permissions
        try {
            (0, fs_1.accessSync)(filePath, fs_1.constants.R_OK);
        }
        catch (_a) {
            return {
                valid: false,
                reason: 'No read permission',
            };
        }
        return {
            valid: true,
            normalizedPath: filePath,
        };
    };
    /**
     * Check if path is within allowed roots
     */
    PathValidator.prototype.isInAllowedRoots = function (filePath) {
        var _this = this;
        return this.config.allowedRoots.some(function (root) {
            var normalizedRoot = _this.normalizePath(root);
            return filePath.startsWith(normalizedRoot);
        });
    };
    /**
     * Check if path is in blocked list
     */
    PathValidator.prototype.isBlocked = function (filePath) {
        var _this = this;
        return this.config.blockedPaths.some(function (blocked) {
            var normalizedBlocked = _this.normalizePath(blocked);
            return filePath.startsWith(normalizedBlocked);
        });
    };
    /**
     * Normalize path (resolve ~, .., symlinks)
     */
    PathValidator.prototype.normalizePath = function (filePath) {
        // Replace ~ with home directory
        if (filePath.startsWith('~')) {
            filePath = path.join(os.homedir(), filePath.slice(1));
        }
        // Resolve to absolute path and normalize
        return path.normalize(path.resolve(filePath));
    };
    /**
     * Get allowed roots
     */
    PathValidator.prototype.getAllowedRoots = function () {
        return __spreadArray([], this.config.allowedRoots, true);
    };
    /**
     * Add allowed root
     */
    PathValidator.prototype.addAllowedRoot = function (rootPath) {
        var normalized = this.normalizePath(rootPath);
        // Check if directory exists
        if (!(0, fs_1.existsSync)(normalized) || !(0, fs_1.statSync)(normalized).isDirectory()) {
            throw new Error('Path must be an existing directory');
        }
        // Check if not blocked
        if (this.isBlocked(normalized)) {
            throw new Error('Cannot add blocked system directory');
        }
        // Add if not already present
        if (!this.config.allowedRoots.includes(normalized)) {
            this.config.allowedRoots.push(normalized);
        }
    };
    /**
     * Remove allowed root
     */
    PathValidator.prototype.removeAllowedRoot = function (rootPath) {
        var normalized = this.normalizePath(rootPath);
        this.config.allowedRoots = this.config.allowedRoots.filter(function (root) { return root !== normalized; });
    };
    /**
     * Get blocked paths
     */
    PathValidator.prototype.getBlockedPaths = function () {
        return __spreadArray([], this.config.blockedPaths, true);
    };
    /**
     * Check if path is safe (quick check without file I/O)
     */
    PathValidator.prototype.isSafe = function (filePath) {
        var normalized = this.normalizePath(filePath);
        // Must be in allowed roots
        if (!this.isInAllowedRoots(normalized)) {
            return false;
        }
        // Must not be blocked
        if (this.isBlocked(normalized)) {
            return false;
        }
        return true;
    };
    /**
     * Sanitize path (remove dangerous characters)
     */
    PathValidator.prototype.sanitizePath = function (filePath) {
        // Remove null bytes
        filePath = filePath.replace(/\0/g, '');
        // Remove control characters
        filePath = filePath.replace(/[\x00-\x1F\x7F]/g, '');
        // Normalize path separators
        filePath = filePath.replace(/\\/g, '/');
        return filePath;
    };
    /**
     * Get configuration
     */
    PathValidator.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    /**
     * Update configuration
     */
    PathValidator.prototype.updateConfig = function (updates) {
        this.config = __assign(__assign({}, this.config), updates);
    };
    return PathValidator;
}());
exports.PathValidator = PathValidator;
/**
 * Singleton instance
 */
var pathValidatorInstance = null;
/**
 * Get PathValidator singleton
 */
function getPathValidator() {
    if (!pathValidatorInstance) {
        pathValidatorInstance = new PathValidator();
    }
    return pathValidatorInstance;
}
/**
 * Validate path (convenience function)
 */
function validatePath(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var validator;
        return __generator(this, function (_a) {
            validator = getPathValidator();
            return [2 /*return*/, validator.validate(filePath)];
        });
    });
}
/**
 * Check if path is safe (convenience function)
 */
function isSafePath(filePath) {
    var validator = getPathValidator();
    return validator.isSafe(filePath);
}
