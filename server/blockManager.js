"use strict";
/**
 * Block Manager - File-based block storage
 * Manages custom email blocks using Node.js file system
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockManager = exports.BlockManager = void 0;
var promises_1 = require("fs/promises");
var path_1 = require("path");
var fs_1 = require("fs");
var storagePathResolver_1 = require("./utils/storagePathResolver");
var DEFAULT_CONFIG = {
    blocksDir: (0, storagePathResolver_1.getStoragePaths)().customBlocks, // Universal cross-platform path
    maxBlockSize: 100 * 1024, // 100KB
    maxBlocks: 100,
};
/**
 * Block Manager Class
 */
var BlockManager = /** @class */ (function () {
    function BlockManager(config) {
        this.config = __assign(__assign({}, DEFAULT_CONFIG), config);
        this.ensureBlocksDirectory();
    }
    /**
     * Ensure blocks directory exists
     */
    BlockManager.prototype.ensureBlocksDirectory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!!(0, fs_1.existsSync)(this.config.blocksDir)) return [3 /*break*/, 2];
                        return [4 /*yield*/, promises_1.default.mkdir(this.config.blocksDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to create blocks directory:', error_1);
                        throw new Error('Failed to initialize block storage');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get file path for a block
     */
    BlockManager.prototype.getBlockFilePath = function (blockId) {
        // Sanitize block ID to prevent directory traversal
        var sanitizedId = blockId.replace(/[^a-zA-Z0-9-_]/g, '');
        return path_1.default.join(this.config.blocksDir, "".concat(sanitizedId, ".json"));
    };
    /**
     * Validate block data
     */
    BlockManager.prototype.validateBlock = function (block) {
        if (!block.name || block.name.trim().length === 0) {
            throw new Error('Block name is required');
        }
        if (!block.category || block.category.trim().length === 0) {
            throw new Error('Block category is required');
        }
        if (!block.html || block.html.trim().length === 0) {
            throw new Error('Block HTML is required');
        }
        if (!block.keywords || !Array.isArray(block.keywords) || block.keywords.length === 0) {
            throw new Error('At least one keyword is required');
        }
        // Check HTML size
        var htmlSize = Buffer.byteLength(block.html, 'utf8');
        if (htmlSize > this.config.maxBlockSize) {
            throw new Error("Block HTML exceeds maximum size of ".concat(this.config.maxBlockSize, " bytes"));
        }
    };
    /**
     * Generate unique block ID
     */
    BlockManager.prototype.generateBlockId = function () {
        return "custom-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
    };
    /**
     * Create a new custom block
     */
    BlockManager.prototype.createBlock = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var existingBlocks, blockId, now, block, filePath, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.validateBlock(data);
                        return [4 /*yield*/, this.listBlocks()];
                    case 1:
                        existingBlocks = _a.sent();
                        if (existingBlocks.length >= this.config.maxBlocks) {
                            throw new Error("Maximum number of blocks (".concat(this.config.maxBlocks, ") reached"));
                        }
                        blockId = this.generateBlockId();
                        now = Date.now();
                        block = {
                            id: blockId,
                            name: data.name.trim(),
                            category: data.category.trim(),
                            keywords: data.keywords.map(function (k) { return k.trim(); }),
                            html: data.html.trim(),
                            preview: data.preview,
                            createdAt: now,
                            updatedAt: now,
                            isCustom: true,
                        };
                        filePath = this.getBlockFilePath(blockId);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, promises_1.default.writeFile(filePath, JSON.stringify(block, null, 2), 'utf8')];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, block];
                    case 4:
                        error_2 = _a.sent();
                        console.error('Failed to create block:', error_2);
                        throw new Error('Failed to save block to file system');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get a block by ID
     */
    BlockManager.prototype.getBlock = function (blockId) {
        return __awaiter(this, void 0, void 0, function () {
            var filePath, content, block, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filePath = this.getBlockFilePath(blockId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        if (!(0, fs_1.existsSync)(filePath)) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, promises_1.default.readFile(filePath, 'utf8')];
                    case 2:
                        content = _a.sent();
                        block = JSON.parse(content);
                        return [2 /*return*/, block];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Failed to read block:', error_3);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update an existing block
     */
    BlockManager.prototype.updateBlock = function (blockId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var existingBlock, updatedBlock, filePath, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getBlock(blockId)];
                    case 1:
                        existingBlock = _a.sent();
                        if (!existingBlock) {
                            return [2 /*return*/, null];
                        }
                        updatedBlock = __assign(__assign(__assign({}, existingBlock), updates), { id: blockId, isCustom: true, updatedAt: Date.now() });
                        this.validateBlock(updatedBlock);
                        filePath = this.getBlockFilePath(blockId);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, promises_1.default.writeFile(filePath, JSON.stringify(updatedBlock, null, 2), 'utf8')];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, updatedBlock];
                    case 4:
                        error_4 = _a.sent();
                        console.error('Failed to update block:', error_4);
                        throw new Error('Failed to update block file');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete a block
     */
    BlockManager.prototype.deleteBlock = function (blockId) {
        return __awaiter(this, void 0, void 0, function () {
            var filePath, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filePath = this.getBlockFilePath(blockId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        if (!(0, fs_1.existsSync)(filePath)) {
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, promises_1.default.unlink(filePath)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Failed to delete block:', error_5);
                        throw new Error('Failed to delete block file');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * List all custom blocks
     */
    BlockManager.prototype.listBlocks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, jsonFiles, blocks, _i, jsonFiles_1, file, filePath, content, block, error_6, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        return [4 /*yield*/, this.ensureBlocksDirectory()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, promises_1.default.readdir(this.config.blocksDir)];
                    case 2:
                        files = _a.sent();
                        jsonFiles = files.filter(function (file) { return file.endsWith('.json'); });
                        blocks = [];
                        _i = 0, jsonFiles_1 = jsonFiles;
                        _a.label = 3;
                    case 3:
                        if (!(_i < jsonFiles_1.length)) return [3 /*break*/, 8];
                        file = jsonFiles_1[_i];
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        filePath = path_1.default.join(this.config.blocksDir, file);
                        return [4 /*yield*/, promises_1.default.readFile(filePath, 'utf8')];
                    case 5:
                        content = _a.sent();
                        block = JSON.parse(content);
                        blocks.push(block);
                        return [3 /*break*/, 7];
                    case 6:
                        error_6 = _a.sent();
                        console.error("Failed to read block file ".concat(file, ":"), error_6);
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 3];
                    case 8:
                        // Sort by creation date (newest first)
                        blocks.sort(function (a, b) { return b.createdAt - a.createdAt; });
                        return [2 /*return*/, blocks];
                    case 9:
                        error_7 = _a.sent();
                        console.error('Failed to list blocks:', error_7);
                        return [2 /*return*/, []];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Search blocks by query
     */
    BlockManager.prototype.searchBlocks = function (query, category) {
        return __awaiter(this, void 0, void 0, function () {
            var allBlocks, filtered, lowerQuery_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.listBlocks()];
                    case 1:
                        allBlocks = _a.sent();
                        filtered = allBlocks;
                        // Filter by category
                        if (category && category !== 'All') {
                            filtered = filtered.filter(function (block) { return block.category === category; });
                        }
                        // Filter by search query
                        if (query.trim()) {
                            lowerQuery_1 = query.toLowerCase();
                            filtered = filtered.filter(function (block) {
                                return block.name.toLowerCase().includes(lowerQuery_1) ||
                                    block.keywords.some(function (keyword) { return keyword.toLowerCase().includes(lowerQuery_1); }) ||
                                    block.category.toLowerCase().includes(lowerQuery_1);
                            });
                        }
                        return [2 /*return*/, filtered];
                }
            });
        });
    };
    /**
     * Get block statistics
     */
    BlockManager.prototype.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var blocks, stats, _i, blocks_1, block;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.listBlocks()];
                    case 1:
                        blocks = _a.sent();
                        stats = {
                            totalBlocks: blocks.length,
                            categories: {},
                            totalSize: 0,
                        };
                        for (_i = 0, blocks_1 = blocks; _i < blocks_1.length; _i++) {
                            block = blocks_1[_i];
                            // Count by category
                            stats.categories[block.category] = (stats.categories[block.category] || 0) + 1;
                            // Calculate total size
                            stats.totalSize += Buffer.byteLength(block.html, 'utf8');
                        }
                        return [2 /*return*/, stats];
                }
            });
        });
    };
    /**
     * Export all blocks as JSON
     */
    BlockManager.prototype.exportBlocks = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.listBlocks()];
            });
        });
    };
    /**
     * Import blocks from JSON
     */
    BlockManager.prototype.importBlocks = function (blocks) {
        return __awaiter(this, void 0, void 0, function () {
            var result, _i, blocks_2, block, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = {
                            imported: 0,
                            failed: 0,
                            errors: [],
                        };
                        _i = 0, blocks_2 = blocks;
                        _a.label = 1;
                    case 1:
                        if (!(_i < blocks_2.length)) return [3 /*break*/, 6];
                        block = blocks_2[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        // Validate and create new block
                        return [4 /*yield*/, this.createBlock({
                                name: block.name,
                                category: block.category,
                                keywords: block.keywords,
                                html: block.html,
                                preview: block.preview,
                            })];
                    case 3:
                        // Validate and create new block
                        _a.sent();
                        result.imported++;
                        return [3 /*break*/, 5];
                    case 4:
                        error_8 = _a.sent();
                        result.failed++;
                        result.errors.push("Failed to import block \"".concat(block.name, "\": ").concat(error_8 instanceof Error ? error_8.message : 'Unknown error'));
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, result];
                }
            });
        });
    };
    return BlockManager;
}());
exports.BlockManager = BlockManager;
// Export singleton instance
exports.blockManager = new BlockManager();
