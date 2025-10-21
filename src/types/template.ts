/**
 * Email Template Library Types
 *
 * Types for the Template Library system that works with .html files
 * from the user's file system (restricted to ~/Templates by default)
 */

export type TemplateCategory = 'Newsletter' | 'Transactional' | 'Marketing' | 'Internal' | 'Other';

export interface EmailTemplate {
  id: string; // UUID
  name: string; // Display name
  filePath: string; // Absolute path to .html file
  relativePath?: string; // Relative path from import root (preserves folder structure)
  folderPath?: string; // Parent folder name(s) for organization
  category: TemplateCategory;
  tags: string[]; // For search functionality
  description?: string; // Optional description
  thumbnail?: string; // Base64 or URL to preview image
  fileSize: number; // In bytes
  lastModified: number; // Timestamp (ms)
  createdAt: number; // When added to library (timestamp ms)
}

export interface TemplateStats {
  total: number;
  totalSize: number;
  byCategory: Record<TemplateCategory, number>;
}

export interface AddTemplatePayload {
  filePath: string;
  name?: string;
  category?: TemplateCategory;
  tags?: string[];
  description?: string;
  thumbnail?: string;
}

export interface UpdateTemplatePayload {
  name?: string;
  category?: TemplateCategory;
  tags?: string[];
  description?: string;
  thumbnail?: string;
  filePath?: string;
}

export interface ImportFolderPayload {
  folderPath: string;
  recursive?: boolean; // Scan subfolders recursively
  category?: TemplateCategory; // Optional default category
  tags?: string[]; // Optional default tags
}

export interface AllowedRootPayload {
  rootPath: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Newsletter',
  'Transactional',
  'Marketing',
  'Internal',
  'Other',
];
