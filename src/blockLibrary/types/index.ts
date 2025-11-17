/**
 * Block Library Types
 */

export interface EmailBlock {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  html: string;
  preview?: string;
  createdAt: number;
  isCustom?: boolean;
  source?: "src" | "data";
  filePath?: string;
}

export type BlockCategory =
  | "header"
  | "footer"
  | "content"
  | "buttons"
  | "images"
  | "social"
  | "divider"
  | "spacer"
  | "other";
