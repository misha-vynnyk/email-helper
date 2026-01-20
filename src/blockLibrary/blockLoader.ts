/**
 * Block Loader Utility
 * Automatically loads all blocks from /blocks directory using Vite's import.meta.glob
 */

import { EmailBlock } from "../types/block";
import { handleStorageError } from "./errorHandling";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { logger } from "../utils/logger";

const CUSTOM_BLOCKS_KEY = STORAGE_KEYS.CUSTOM_BLOCKS;

/**
 * Load all predefined blocks from /blocks directory
 */
export async function loadPredefinedBlocks(): Promise<EmailBlock[]> {
  const blockModules = import.meta.glob("../blocks/*.ts", { eager: true });
  const blocks: EmailBlock[] = [];

  for (const path in blockModules) {
    const module = blockModules[path] as { default: EmailBlock };
    if (module.default) {
      blocks.push(module.default);
    }
  }

  return blocks.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Load custom blocks from localStorage
 */
export function loadCustomBlocks(): EmailBlock[] {
  try {
    const stored = localStorage.getItem(CUSTOM_BLOCKS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logger.error("blockLoader", "Failed to load custom blocks", error);
  }
  return [];
}

/**
 * Save custom blocks to localStorage
 */
export function saveCustomBlocks(blocks: EmailBlock[]): void {
  try {
    localStorage.setItem(CUSTOM_BLOCKS_KEY, JSON.stringify(blocks));
  } catch (error) {
    const storageError = handleStorageError(error);
    logger.error("blockLoader", "Failed to save custom blocks", storageError);
    throw storageError;
  }
}

/**
 * Add a new custom block
 */
export function addCustomBlock(
  block: Omit<EmailBlock, "id" | "createdAt" | "isCustom">
): EmailBlock {
  const customBlocks = loadCustomBlocks();

  const newBlock: EmailBlock = {
    ...block,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    isCustom: true,
  };

  customBlocks.push(newBlock);
  saveCustomBlocks(customBlocks);

  return newBlock;
}

/**
 * Update a custom block
 */
export function updateCustomBlock(
  blockId: string,
  updates: Partial<EmailBlock>
): EmailBlock | null {
  const customBlocks = loadCustomBlocks();
  const blockIndex = customBlocks.findIndex((block) => block.id === blockId);

  if (blockIndex === -1) {
    return null;
  }

  const updatedBlock = {
    ...customBlocks[blockIndex],
    ...updates,
    id: blockId, // Ensure ID doesn't change
    isCustom: true, // Ensure it stays custom
  };

  customBlocks[blockIndex] = updatedBlock;
  saveCustomBlocks(customBlocks);

  return updatedBlock;
}

/**
 * Remove a custom block
 */
export function removeCustomBlock(blockId: string): void {
  const customBlocks = loadCustomBlocks();
  const filtered = customBlocks.filter((block) => block.id !== blockId);
  saveCustomBlocks(filtered);
}

/**
 * Search blocks by query and category
 */
export function searchBlocks(blocks: EmailBlock[], query: string, category?: string): EmailBlock[] {
  let filtered = blocks;

  // Filter by category
  if (category && category !== "All") {
    filtered = filtered.filter((block) => block.category === category);
  }

  // Filter by search query
  if (query.trim()) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter(
      (block) =>
        block.name.toLowerCase().includes(lowerQuery) ||
        block.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery)) ||
        block.category.toLowerCase().includes(lowerQuery)
    );
  }

  return filtered;
}

/**
 * Get all unique categories from blocks
 */
export function getCategories(blocks: EmailBlock[]): string[] {
  const categories = new Set<string>();
  blocks.forEach((block) => categories.add(block.category));
  return ["All", ...Array.from(categories).sort()];
}
