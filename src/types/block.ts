/**
 * Email Block Library Types
 */

export type BlockCategory =
  | "Structure"
  | "Content"
  | "Buttons"
  | "Footer"
  | "Headers"
  | "Social"
  | "Custom";

export interface EmailBlock {
  id: string;
  name: string;
  category: BlockCategory;
  keywords: string[];
  preview?: string; // URL or base64 image
  html: string; // Email-safe HTML markup
  createdAt: number; // timestamp
  isCustom?: boolean; // User-added blocks
  source?: "src" | "data" | "localStorage"; // Source location for unique keys
  filePath?: string; // Full file path for file-based blocks
}

export interface BlockSearchQuery {
  query: string;
  category?: BlockCategory;
}

export interface BlockLibraryState {
  blocks: EmailBlock[];
  customBlocks: EmailBlock[];
  searchQuery: string;
  selectedCategory?: BlockCategory;
}
