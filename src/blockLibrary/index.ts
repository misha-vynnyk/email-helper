/**
 * Block Library Public API
 */

// Main component
export { default as BlockLibrary } from "./BlockLibrary";

// Hooks
export { useBlocks } from "./hooks/useBlocks";

// Services
export { blockService, BlockService } from "./services/blockService";

// Types
export type { EmailBlock, BlockCategory } from "./types";

// Utils (for backward compatibility)
export {
  loadPredefinedBlocks,
  loadCustomBlocks,
  saveCustomBlocks,
  addCustomBlock,
  updateCustomBlock,
  removeCustomBlock,
  searchBlocks,
  getCategories,
} from "./blockLoader";

export {
  getStorageLocations,
  addStorageLocation,
  removeStorageLocation,
  setDefaultLocation,
  getDefaultLocation,
} from "./blockStorageConfig";
