# Dynamic Scan Directories - Backend Auto-Discovery

## 🐛 Problem

**Issue:** Storage locations configured in frontend were NOT used by backend:

1. ❌ User adds custom storage location in `BlockStorageModal` (e.g., `/Users/.../Documents/project/blocks`)
2. ❌ User creates block in that location
3. ❌ File is created successfully in the custom location
4. ❌ **BUT** block doesn't appear in the list - backend only scans hardcoded paths
5. ❌ User refreshes - still not visible

**Root Cause:**

Backend `listBlocks()` only scanned two fixed directories:

```typescript
// BEFORE:
async listBlocks(): Promise<BlockFile[]> {
  // 1. Scan data/blocks/files (hardcoded)
  // 2. Scan src/blocks (hardcoded)
  // ❌ Never scans custom directories!
}
```

## ✅ Solution

Backend now **remembers** where blocks were created and automatically scans those directories.

### How It Works

1. **Persistent Configuration File**
   - Location: `server/data/blocks/block-manager-config.json`
   - Stores: List of all directories with block files
   - Auto-loaded on server start

2. **Auto-Discovery on Block Creation**
   - When block is created with `targetPath`
   - Directory is automatically added to scan list
   - Configuration is saved to disk
   - Future `listBlocks()` calls include this directory

3. **Duplicate Prevention**
   - Won't add same directory twice
   - Won't add default directories (`src/blocks`, `data/blocks/files`)
   - Normalizes paths before comparison

## 🔧 Implementation

### 1. Configuration Interface

**File:** `server/blockFileManager.ts`

```typescript
interface BlockFileManagerConfig {
  blocksDir: string;
  scanDirectories?: string[]; // ✅ NEW: Additional directories to scan
}
```

### 2. Persistent Storage

```typescript
export class BlockFileManager {
  private configFilePath: string;

  constructor() {
    this.configFilePath = path.join(blocksDir, "..", "block-manager-config.json");
    this.loadPersistedConfig(); // Load on startup
  }

  private loadPersistedConfig(): void {
    if (existsSync(this.configFilePath)) {
      const persisted = JSON.parse(readFileSync(this.configFilePath));
      this.config.scanDirectories = persisted.scanDirectories;
    }
  }

  private async saveConfig(): Promise<void> {
    await fs.writeFile(
      this.configFilePath,
      JSON.stringify({ scanDirectories: this.config.scanDirectories })
    );
  }
}
```

### 3. Auto-Add on Create

```typescript
async createBlock(data: { targetPath?: string; ... }): Promise<BlockFile> {
  // ... create file logic ...

  // ✅ Add directory to scan list if it's a custom path
  if (data.targetPath) {
    await this.addScanDirectory(targetDirectory);
  }

  return block;
}

private async addScanDirectory(dirPath: string): Promise<void> {
  const normalizedPath = path.normalize(dirPath);

  // Don't add if already in list or if it's a default path
  if (!this.config.scanDirectories.includes(normalizedPath) && !isDefaultPath(normalizedPath)) {
    this.config.scanDirectories.push(normalizedPath);
    await this.saveConfig();
    console.log(`📁 Added scan directory: ${normalizedPath}`);
  }
}
```

### 4. Dynamic Scanning

```typescript
async listBlocks(): Promise<BlockFile[]> {
  const blocks: BlockFile[] = [];

  // 1. Scan default blocksDir
  blocks.push(...await this.scanDirectory(this.config.blocksDir));

  // 2. Scan src/blocks
  blocks.push(...await this.scanDirectory(srcBlocksDir));

  // 3. ✅ Scan all additional directories
  if (this.config.scanDirectories && this.config.scanDirectories.length > 0) {
    console.log(`📂 Scanning ${this.config.scanDirectories.length} additional directories...`);
    for (const dir of this.config.scanDirectories) {
      const customBlocks = await this.scanDirectory(dir);
      blocks.push(...customBlocks);
      console.log(`  ✓ ${dir}: ${customBlocks.length} blocks`);
    }
  }

  // Remove duplicates and sort
  const uniqueBlocks = Array.from(
    new Map(blocks.map(block => [block.filePath, block])).values()
  );

  return uniqueBlocks.sort((a, b) => b.createdAt - a.createdAt);
}
```

## 📊 Flow Example

### Scenario: User adds custom location

```
1. User opens BlockStorageModal
   └─ Adds location: "External Blocks" → /Users/.../Documents/project/blocks

2. User creates new block "hero-banner" in that location
   └─ Frontend sends: targetPath: "/Users/.../Documents/project/blocks"

3. Backend createBlock() receives request
   ├─ Validates path (within Documents folder ✓)
   ├─ Creates directory if doesn't exist
   ├─ Writes hero-banner.ts file
   └─ ✅ Calls addScanDirectory("/Users/.../Documents/project/blocks")
       ├─ Adds to config.scanDirectories
       └─ Saves to block-manager-config.json

4. User refreshes Block Library
   └─ Frontend calls blockFileApi.listBlocks()
       └─ Backend listBlocks() scans:
           ├─ server/data/blocks/files
           ├─ src/blocks
           └─ ✅ /Users/.../Documents/project/blocks (from config)
               └─ Finds hero-banner.ts!

5. Block appears in UI ✓
```

## 📁 Config File Example

**File:** `server/data/blocks/block-manager-config.json`

```json
{
  "scanDirectories": [
    "/Users/mykhailo.vynnyk/Documents/EPC-Network/email-devs/blocks",
    "/Users/mykhailo.vynnyk/Documents/projects/shared-blocks",
    "custom/blocks"
  ]
}
```

## 🔒 Security

- Paths are validated before being added
- Only directories within project or Documents folder allowed
- Same security checks as `createBlock()`
- No directory traversal attacks possible

## 🎯 Benefits

1. **Automatic Discovery**: No manual configuration needed
2. **Persistent**: Survives server restarts
3. **Flexible**: Works with any number of custom directories
4. **Safe**: Only scans directories where blocks were actually created
5. **Efficient**: Removes duplicates, caches config

## 🧪 Testing

**Test the flow:**

1. Start backend server
2. In frontend, open Block Storage settings
3. Add custom location: `/Users/.../Documents/test/blocks`
4. Create a block in that location
5. Check backend console - should see:
   ```
   📁 Added scan directory: /Users/.../Documents/test/blocks
   ```
6. Refresh block list
7. Check backend console - should see:
   ```
   📂 Scanning 1 additional directories...
     ✓ /Users/.../Documents/test/blocks: 1 blocks
   📊 Total blocks found: X
   ```
8. Block should appear in frontend!

## 🔄 Restart Behavior

**Server restart:**

1. `BlockFileManager` constructor runs
2. Calls `loadPersistedConfig()`
3. Reads `block-manager-config.json`
4. Loads all `scanDirectories`
5. All custom blocks immediately visible ✓

**Config file deleted:**

- Falls back to default directories only
- Blocks in custom locations won't appear until recreated
- Can manually rebuild config by creating blocks again

## 📝 Files Modified

- ✅ `server/blockFileManager.ts`
  - Added `scanDirectories` to config interface
  - Added `configFilePath` property
  - Added `loadPersistedConfig()` method
  - Added `saveConfig()` method
  - Added `addScanDirectory()` method
  - Added `scanDirectory()` helper method
  - Updated `listBlocks()` to scan all directories
  - Updated `createBlock()` to auto-add directories

## 🚀 Impact

**Before:**

- ❌ Custom locations don't work
- ❌ Blocks not visible after creation
- ❌ Hardcoded paths only

**After:**

- ✅ Custom locations work perfectly
- ✅ Blocks visible immediately after creation
- ✅ Unlimited custom directories
- ✅ Persistent across restarts
- ✅ Zero frontend changes needed
