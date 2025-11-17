/**
 * Template Library Types
 */

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  keywords: string[];
  html: string;
  preview?: string;
  createdAt: number;
  updatedAt?: number;
  isCustom?: boolean;
  source?: "src" | "data";
  filePath?: string;
}

export type TemplateCategory =
  | "newsletter"
  | "promotional"
  | "transactional"
  | "announcement"
  | "welcome"
  | "confirmation"
  | "other";

export interface TemplateMetadata {
  subject?: string;
  preheader?: string;
  author?: string;
  version?: string;
}
