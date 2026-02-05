"use strict";
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (((f = 1), y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)) return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!((t = _.trys), (t = t.length > 0 && t[t.length - 1])) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockFileManager = exports.BlockFileManager = void 0;
/**
 * BlockFileManager
 *
 * Handles creation, reading, updating, and deletion of TypeScript block files.
 * Cross-platform support (Windows, macOS, Linux)
 *
 * Security: Uses WorkspaceManager for secure file system access
 */
var fs = require("fs/promises");
var path = require("path");
var fs_1 = require("fs");
var storagePathResolver_1 = require("./utils/storagePathResolver");
var workspaceManager_1 = require("./workspaceManager");
var htmlSanitizer_1 = require("./utils/htmlSanitizer");
var blocksDir = (0, storagePathResolver_1.getStoragePaths)().blockFiles;
var srcBlocksDir = path.resolve(__dirname, "../../src/blocks");
var DEFAULT_CONFIG = {
  blocksDir: blocksDir, // Universal cross-platform path
  scanDirectories: [],
};
/**
 * Block File Manager Class
 */
var BlockFileManager = /** @class */ (function () {
  function BlockFileManager(config) {
    this.workspaceManager = (0, workspaceManager_1.getWorkspaceManager)();
    this.config = __assign(__assign({}, DEFAULT_CONFIG), config);
    // Path to persistent config file
    this.configFilePath = path.join(blocksDir, "..", "block-manager-config.json");
    this.loadPersistedConfig();
  }
  /**
   * Load persisted configuration (scan directories)
   */
  BlockFileManager.prototype.loadPersistedConfig = function () {
    try {
      if ((0, fs_1.existsSync)(this.configFilePath)) {
        var data = require("fs").readFileSync(this.configFilePath, "utf8");
        var persisted = JSON.parse(data);
        if (persisted.scanDirectories && Array.isArray(persisted.scanDirectories)) {
          this.config.scanDirectories = persisted.scanDirectories;
          console.log("\uD83D\uDCC2 Loaded ".concat(persisted.scanDirectories.length, " scan directories"));
        }
      }
    } catch (error) {
      console.warn("Failed to load persisted config:", error);
    }
  };
  /**
   * Save configuration to file
   */
  BlockFileManager.prototype.saveConfig = function () {
    return __awaiter(this, void 0, void 0, function () {
      var configDir, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4, , 5]);
            configDir = path.dirname(this.configFilePath);
            if ((0, fs_1.existsSync)(configDir)) return [3 /*break*/, 2];
            return [4 /*yield*/, fs.mkdir(configDir, { recursive: true })];
          case 1:
            _a.sent();
            _a.label = 2;
          case 2:
            return [4 /*yield*/, fs.writeFile(this.configFilePath, JSON.stringify({ scanDirectories: this.config.scanDirectories }, null, 2), "utf8")];
          case 3:
            _a.sent();
            return [3 /*break*/, 5];
          case 4:
            error_1 = _a.sent();
            console.error("Failed to save config:", error_1);
            return [3 /*break*/, 5];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Add directory to scan list
   */
  BlockFileManager.prototype.addScanDirectory = function (dirPath) {
    return __awaiter(this, void 0, void 0, function () {
      var normalizedPath, defaultPaths;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!this.config.scanDirectories) {
              this.config.scanDirectories = [];
            }
            normalizedPath = path.normalize(dirPath);
            defaultPaths = [path.normalize(this.config.blocksDir), path.normalize(srcBlocksDir)];
            if (!(!this.config.scanDirectories.includes(normalizedPath) && !defaultPaths.includes(normalizedPath))) return [3 /*break*/, 2];
            this.config.scanDirectories.push(normalizedPath);
            return [4 /*yield*/, this.saveConfig()];
          case 1:
            _a.sent();
            console.log("\uD83D\uDCC1 Added scan directory: ".concat(normalizedPath));
            _a.label = 2;
          case 2:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Generate TypeScript code for a block
   */
  BlockFileManager.prototype.generateBlockCode = function (block) {
    var previewValue = block.preview || "";
    // Use original block HTML without wrapping
    var htmlEscaped = block.html.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
    // Format keywords with single quotes
    var keywordsFormatted = "[".concat(
      block.keywords
        .map(function (k) {
          return "'".concat(k, "'");
        })
        .join(", "),
      "]"
    );
    return "import { EmailBlock } from '../types/block';\n\nconst ".concat(this.toPascalCase(block.id), ": EmailBlock = {\n  id: '").concat(block.id, "',\n  name: '").concat(block.name, "',\n  category: '").concat(block.category, "',\n  keywords: ").concat(keywordsFormatted, ",\n  preview: '").concat(previewValue, "',\n  html: `\n").concat(htmlEscaped, "\n  `.trim(),\n  createdAt: Date.now(),\n};\n\nexport default ").concat(this.toPascalCase(block.id), ";\n");
  };
  /**
   * Convert kebab-case to PascalCase
   */
  BlockFileManager.prototype.toPascalCase = function (str) {
    return str
      .split("-")
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join("");
  };
  /**
   * Convert PascalCase/camelCase to kebab-case
   */
  BlockFileManager.prototype.toKebabCase = function (str) {
    return str
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .toLowerCase();
  };
  /**
   * Parse TypeScript block file
   */
  BlockFileManager.prototype.parseBlockFile = function (filePath, fileName) {
    return __awaiter(this, void 0, void 0, function () {
      var content, idMatch, nameMatch, categoryMatch, keywordsMatch, previewMatch, htmlMatch, createdAtMatch, keywords, keywordsStr, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [4 /*yield*/, fs.readFile(filePath, "utf8")];
          case 1:
            content = _a.sent();
            idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
            nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
            categoryMatch = content.match(/category:\s*['"]([^'"]+)['"]/);
            keywordsMatch = content.match(/keywords:\s*(\[[^\]]+\])/);
            previewMatch = content.match(/preview:\s*['"]([^'"]*)['"]/);
            htmlMatch = content.match(/html:\s*`([\s\S]*?)`\s*\.trim\(\)/);
            createdAtMatch = content.match(/createdAt:\s*(\d+)/);
            if (!idMatch || !nameMatch || !categoryMatch || !htmlMatch) {
              console.warn("Invalid block file format: ".concat(fileName));
              return [2 /*return*/, null];
            }
            keywords = [];
            if (keywordsMatch) {
              keywordsStr = keywordsMatch[1].replace(/'/g, '"');
              keywords = JSON.parse(keywordsStr);
            }
            return [
              2 /*return*/,
              {
                id: idMatch[1],
                name: nameMatch[1],
                category: categoryMatch[1],
                keywords: keywords,
                preview: previewMatch ? previewMatch[1] : "",
                html: htmlMatch[1].trim(),
                createdAt: createdAtMatch ? parseInt(createdAtMatch[1]) : Date.now(),
                fileName: fileName,
                filePath: filePath,
              },
            ];
          case 2:
            error_2 = _a.sent();
            console.error("Failed to parse block file ".concat(fileName, ":"), error_2);
            return [2 /*return*/, null];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Scan a directory for block files
   */
  BlockFileManager.prototype.scanDirectory = function (dirPath) {
    return __awaiter(this, void 0, void 0, function () {
      var blocks, files, tsFiles, _i, tsFiles_1, file, filePath, block, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            blocks = [];
            _a.label = 1;
          case 1:
            _a.trys.push([1, 7, , 8]);
            if (!(0, fs_1.existsSync)(dirPath)) {
              return [2 /*return*/, blocks];
            }
            return [4 /*yield*/, fs.readdir(dirPath)];
          case 2:
            files = _a.sent();
            tsFiles = files.filter(function (file) {
              return file.endsWith(".ts") && file !== "README.md";
            });
            ((_i = 0), (tsFiles_1 = tsFiles));
            _a.label = 3;
          case 3:
            if (!(_i < tsFiles_1.length)) return [3 /*break*/, 6];
            file = tsFiles_1[_i];
            filePath = path.join(dirPath, file);
            return [4 /*yield*/, this.parseBlockFile(filePath, file)];
          case 4:
            block = _a.sent();
            if (block) {
              blocks.push(block);
            }
            _a.label = 5;
          case 5:
            _i++;
            return [3 /*break*/, 3];
          case 6:
            return [3 /*break*/, 8];
          case 7:
            error_3 = _a.sent();
            console.warn("Failed to scan directory ".concat(dirPath, ":"), error_3);
            return [3 /*break*/, 8];
          case 8:
            return [2 /*return*/, blocks];
        }
      });
    });
  };
  /**
   * List all block files fr all configured directories
   */
  BlockFileManager.prototype.listBlocks = function () {
    return __awaiter(this, void 0, void 0, function () {
      var blocks, defaultBlocks, srcBlocks, _i, _a, dir, customBlocks, uniqueBlocks, error_4;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 7, , 8]);
            blocks = [];
            return [4 /*yield*/, this.scanDirectory(this.config.blocksDir)];
          case 1:
            defaultBlocks = _b.sent();
            blocks.push.apply(blocks, defaultBlocks);
            return [4 /*yield*/, this.scanDirectory(srcBlocksDir)];
          case 2:
            srcBlocks = _b.sent();
            blocks.push.apply(blocks, srcBlocks);
            if (!(this.config.scanDirectories && this.config.scanDirectories.length > 0)) return [3 /*break*/, 6];
            console.log("\uD83D\uDCC2 Scanning ".concat(this.config.scanDirectories.length, " additional directories..."));
            ((_i = 0), (_a = this.config.scanDirectories));
            _b.label = 3;
          case 3:
            if (!(_i < _a.length)) return [3 /*break*/, 6];
            dir = _a[_i];
            return [4 /*yield*/, this.scanDirectory(dir)];
          case 4:
            customBlocks = _b.sent();
            blocks.push.apply(blocks, customBlocks);
            console.log("  \u2713 ".concat(dir, ": ").concat(customBlocks.length, " blocks"));
            _b.label = 5;
          case 5:
            _i++;
            return [3 /*break*/, 3];
          case 6:
            uniqueBlocks = Array.from(
              new Map(
                blocks.map(function (block) {
                  return [block.filePath, block];
                })
              ).values()
            );
            // Sort by creation date (newest first)
            uniqueBlocks.sort(function (a, b) {
              return b.createdAt - a.createdAt;
            });
            console.log("\uD83D\uDCCA Total blocks found: ".concat(uniqueBlocks.length));
            return [2 /*return*/, uniqueBlocks];
          case 7:
            error_4 = _b.sent();
            console.error("Failed to list blocks:", error_4);
            return [2 /*return*/, []];
          case 8:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Get a single block by ID
   */
  BlockFileManager.prototype.getBlock = function (blockId) {
    return __awaiter(this, void 0, void 0, function () {
      var fileName, filePath;
      return __generator(this, function (_a) {
        fileName = "".concat(blockId, ".ts");
        filePath = path.join(this.config.blocksDir, fileName);
        if (!(0, fs_1.existsSync)(filePath)) {
          return [2 /*return*/, null];
        }
        return [2 /*return*/, this.parseBlockFile(filePath, fileName)];
      });
    });
  };
  /**
   * Validate and resolve target directory path using WorkspaceManager
   *
   * @security Uses WorkspaceManager to ensure path is in allowed workspace
   */
  BlockFileManager.prototype.validateTargetPath = function (targetPath) {
    return __awaiter(this, void 0, void 0, function () {
      var projectRoot, resolvedPath, normalizedPath, accessCheck, result, parentDir, parentAccess, stats;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            projectRoot = path.resolve(__dirname, "../..");
            if (path.isAbsolute(targetPath)) {
              resolvedPath = targetPath;
            } else {
              resolvedPath = path.join(projectRoot, targetPath);
            }
            normalizedPath = path.normalize(resolvedPath);
            accessCheck = this.workspaceManager.canAccess(normalizedPath, true);
            if (accessCheck.allowed) return [3 /*break*/, 2];
            return [4 /*yield*/, this.workspaceManager.requestWorkspaceAccess(normalizedPath, "Custom Blocks")];
          case 1:
            result = _a.sent();
            if (result.success) {
              // Re-check access after registration
              accessCheck = this.workspaceManager.canAccess(normalizedPath, true);
            } else {
              throw new Error("Access denied: ".concat(result.error || "Path not in allowed workspace"));
            }
            _a.label = 2;
          case 2:
            if (!accessCheck.allowed) {
              throw new Error("Access denied: ".concat(accessCheck.reason || "Path not in allowed workspace"));
            }
            if ((0, fs_1.existsSync)(normalizedPath)) return [3 /*break*/, 4];
            parentDir = path.dirname(normalizedPath);
            parentAccess = this.workspaceManager.canAccess(parentDir, true);
            if (!parentAccess.allowed) {
              throw new Error("Cannot create directory: parent path not in workspace");
            }
            // Create directory
            return [4 /*yield*/, fs.mkdir(normalizedPath, { recursive: true })];
          case 3:
            // Create directory
            _a.sent();
            console.log("\uD83D\uDCC1 Created directory: ".concat(normalizedPath));
            _a.label = 4;
          case 4:
            return [4 /*yield*/, fs.stat(normalizedPath)];
          case 5:
            stats = _a.sent();
            if (!stats.isDirectory()) {
              throw new Error("Target path must be a directory");
            }
            return [2 /*return*/, normalizedPath];
        }
      });
    });
  };
  /**
   * Create a new block file
   */
  BlockFileManager.prototype.createBlock = function (data) {
    return __awaiter(this, void 0, void 0, function () {
      var sanitizedHTML, blockId, fileName, targetDirectory, filePath, code;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            sanitizedHTML = (0, htmlSanitizer_1.sanitizeHTML)(data.html);
            blockId = this.toKebabCase(data.id.replace(/[^a-zA-Z0-9-]/g, "-"));
            fileName = "".concat(blockId, ".ts");
            if (!data.targetPath) return [3 /*break*/, 2];
            return [4 /*yield*/, this.validateTargetPath(data.targetPath)];
          case 1:
            // Use custom path (new behavior)
            targetDirectory = _a.sent();
            return [3 /*break*/, 3];
          case 2:
            if (data.targetDir === "src") {
              // Legacy: hardcoded 'src' path
              targetDirectory = srcBlocksDir;
            } else {
              // Legacy: default to 'data' path
              targetDirectory = this.config.blocksDir;
            }
            _a.label = 3;
          case 3:
            filePath = path.join(targetDirectory, fileName);
            // Check if file already exists
            if ((0, fs_1.existsSync)(filePath)) {
              throw new Error('Block with ID "'.concat(blockId, '" already exists at ').concat(filePath));
            }
            code = this.generateBlockCode(__assign(__assign({}, data), { id: blockId, html: sanitizedHTML }));
            // Write file
            return [4 /*yield*/, fs.writeFile(filePath, code, "utf8")];
          case 4:
            // Write file
            _a.sent();
            console.log("\u2705 Created block file: ".concat(filePath));
            if (!data.targetPath) return [3 /*break*/, 6];
            return [4 /*yield*/, this.addScanDirectory(targetDirectory)];
          case 5:
            _a.sent();
            _a.label = 6;
          case 6:
            // Return created block
            return [
              2 /*return*/,
              {
                id: blockId,
                name: data.name,
                category: data.category,
                keywords: data.keywords,
                html: sanitizedHTML, // Return sanitized HTML
                preview: data.preview || "",
                createdAt: Date.now(),
                fileName: fileName,
                filePath: filePath,
              },
            ];
        }
      });
    });
  };
  /**
   * Update an existing block file
   */
  BlockFileManager.prototype.updateBlock = function (blockId, updates) {
    return __awaiter(this, void 0, void 0, function () {
      var existingBlock, updatedData, code;
      var _a, _b, _c, _d, _e;
      return __generator(this, function (_f) {
        switch (_f.label) {
          case 0:
            return [4 /*yield*/, this.getBlock(blockId)];
          case 1:
            existingBlock = _f.sent();
            if (!existingBlock) {
              return [2 /*return*/, null];
            }
            updatedData = {
              id: existingBlock.id,
              name: (_a = updates.name) !== null && _a !== void 0 ? _a : existingBlock.name,
              category: (_b = updates.category) !== null && _b !== void 0 ? _b : existingBlock.category,
              keywords: (_c = updates.keywords) !== null && _c !== void 0 ? _c : existingBlock.keywords,
              html: (_d = updates.html) !== null && _d !== void 0 ? _d : existingBlock.html,
              preview: (_e = updates.preview) !== null && _e !== void 0 ? _e : existingBlock.preview,
            };
            code = this.generateBlockCode(updatedData);
            // Write file
            return [4 /*yield*/, fs.writeFile(existingBlock.filePath, code, "utf8")];
          case 2:
            // Write file
            _f.sent();
            // Return updated block
            return [2 /*return*/, __assign(__assign({}, updatedData), { createdAt: existingBlock.createdAt, fileName: existingBlock.fileName, filePath: existingBlock.filePath })];
        }
      });
    });
  };
  /**
   * Delete a block file
   */
  BlockFileManager.prototype.deleteBlock = function (blockId) {
    return __awaiter(this, void 0, void 0, function () {
      var allBlocks, blockToDelete, filePath, error_5;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.listBlocks()];
          case 1:
            allBlocks = _a.sent();
            blockToDelete = allBlocks.find(function (b) {
              return b.id === blockId;
            });
            if (!blockToDelete) {
              console.warn("Block not found: ".concat(blockId));
              return [2 /*return*/, false];
            }
            filePath = blockToDelete.filePath;
            if (!(0, fs_1.existsSync)(filePath)) {
              console.warn("File not found: ".concat(filePath));
              return [2 /*return*/, false];
            }
            _a.label = 2;
          case 2:
            _a.trys.push([2, 4, , 5]);
            return [4 /*yield*/, fs.unlink(filePath)];
          case 3:
            _a.sent();
            console.log("\u2705 Deleted block file: ".concat(filePath));
            return [2 /*return*/, true];
          case 4:
            error_5 = _a.sent();
            console.error("Failed to delete block:", error_5);
            throw new Error("Failed to delete block file");
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Search blocks
   */
  BlockFileManager.prototype.searchBlocks = function (query, category) {
    return __awaiter(this, void 0, void 0, function () {
      var allBlocks, filtered, lowerQuery_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.listBlocks()];
          case 1:
            allBlocks = _a.sent();
            filtered = allBlocks;
            // Filter by category
            if (category && category !== "All") {
              filtered = filtered.filter(function (block) {
                return block.category === category;
              });
            }
            // Filter by search query
            if (query.trim()) {
              lowerQuery_1 = query.toLowerCase();
              filtered = filtered.filter(function (block) {
                return (
                  block.name.toLowerCase().includes(lowerQuery_1) ||
                  block.keywords.some(function (keyword) {
                    return keyword.toLowerCase().includes(lowerQuery_1);
                  }) ||
                  block.id.toLowerCase().includes(lowerQuery_1)
                );
              });
            }
            return [2 /*return*/, filtered];
        }
      });
    });
  };
  /**
   * Get allowed root directories
   */
  BlockFileManager.prototype.getAllowedRoots = function () {
    // For now, return the blocks directory as the only allowed root
    // In the future, this could be configurable
    return [this.config.blocksDir];
  };
  /**
   * Add allowed root directory
   */
  BlockFileManager.prototype.addAllowedRoot = function (rootPath) {
    return __awaiter(this, void 0, void 0, function () {
      var normalizedPath;
      return __generator(this, function (_a) {
        normalizedPath = path.resolve(rootPath);
        if (!(0, fs_1.existsSync)(normalizedPath)) {
          throw new Error("Path must be an existing directory");
        }
        // For now, we only support the main blocks directory
        // In the future, this could be expanded to support multiple directories
        console.log("\uD83D\uDCC1 Block directory management: ".concat(normalizedPath, " would be added to allowed roots"));
        return [2 /*return*/];
      });
    });
  };
  /**
   * Remove allowed root directory
   */
  BlockFileManager.prototype.removeAllowedRoot = function (rootPath) {
    return __awaiter(this, void 0, void 0, function () {
      var normalizedPath, allBlocks, blocksToRemove, validBlocks, _i, allBlocks_1, block;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            normalizedPath = path.resolve(rootPath);
            return [4 /*yield*/, this.listBlocks()];
          case 1:
            allBlocks = _a.sent();
            blocksToRemove = [];
            validBlocks = [];
            for (_i = 0, allBlocks_1 = allBlocks; _i < allBlocks_1.length; _i++) {
              block = allBlocks_1[_i];
              if (block.filePath.startsWith(normalizedPath)) {
                console.log("\uD83D\uDDD1\uFE0F Removing block from deleted directory: ".concat(block.name, " (").concat(block.filePath, ")"));
                blocksToRemove.push(block);
              } else {
                validBlocks.push(block);
              }
            }
            // Note: In a real implementation, you would update the configuration
            // to remove the directory from allowed roots and clean up the database
            console.log("\uD83E\uDDF9 Would remove ".concat(blocksToRemove.length, " blocks from deleted directory: ").concat(normalizedPath));
            return [
              2 /*return*/,
              {
                removed: blocksToRemove.length,
                blocks: blocksToRemove,
              },
            ];
        }
      });
    });
  };
  return BlockFileManager;
})();
exports.BlockFileManager = BlockFileManager;
// Export singleton instance
exports.blockFileManager = new BlockFileManager();
