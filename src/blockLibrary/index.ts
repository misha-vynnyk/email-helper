/**
 * Block Library Public API
 */

// Main component
export { default as BlockLibrary } from "./BlockLibrary";

// Types (from main types)
export type { EmailBlock, BlockCategory } from "../types/block";

// Utils
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
