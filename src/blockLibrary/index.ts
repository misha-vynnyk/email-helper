/**
 * Block Library Public API
 */

// Main component
export { default as BlockLibrary } from "./BlockLibrary";

// Types (from main types)
export type { BlockCategory,EmailBlock } from "../types/block";

// Utils
export {
  addCustomBlock,
  getCategories,
  loadCustomBlocks,
  loadPredefinedBlocks,
  removeCustomBlock,
  saveCustomBlocks,
  searchBlocks,
  updateCustomBlock,
} from "./blockLoader";
export {
  addStorageLocation,
  getDefaultLocation,
  getStorageLocations,
  removeStorageLocation,
  setDefaultLocation,
} from "./blockStorageConfig";
