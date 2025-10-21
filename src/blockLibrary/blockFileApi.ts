/**
 * Block File API Client
 * HTTP client for managing TypeScript block files
 */

import API_URL from "../config/api";

const API_BASE_URL = `${API_URL}/api/block-files`;

export interface BlockFileData {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  html: string;
  preview?: string;
  fileName?: string;
  filePath?: string;
  createdAt?: number;
}

/**
 * Block File API Client
 */
export class BlockFileApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch with error handling
   */
  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  /**
   * List all block files
   */
  async listBlocks(search?: string, category?: string): Promise<BlockFileData[]> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category && category !== "All") params.append("category", category);

    const url = `${this.baseUrl}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await this.fetchWithErrorHandling<{ blocks: BlockFileData[] }>(url);

    return response.blocks;
  }

  /**
   * Get a specific block file by ID
   */
  async getBlock(blockId: string): Promise<BlockFileData> {
    const url = `${this.baseUrl}/${blockId}`;
    const response = await this.fetchWithErrorHandling<{ block: BlockFileData }>(url);

    return response.block;
  }

  /**
   * Create a new block file
   */
  async createBlock(data: {
    id: string;
    name: string;
    category: string;
    keywords: string[];
    html: string;
    preview?: string;
    targetPath?: string; // Arbitrary path (preferred)
    targetDir?: "src" | "data"; // Legacy support
  }): Promise<BlockFileData> {
    const url = this.baseUrl;
    const response = await this.fetchWithErrorHandling<{ block: BlockFileData }>(url, {
      method: "POST",
      body: JSON.stringify(data),
    });

    return response.block;
  }

  /**
   * Update an existing block file
   */
  async updateBlock(
    blockId: string,
    updates: {
      name?: string;
      category?: string;
      keywords?: string[];
      html?: string;
      preview?: string;
    }
  ): Promise<BlockFileData> {
    const url = `${this.baseUrl}/${blockId}`;
    const response = await this.fetchWithErrorHandling<{ block: BlockFileData }>(url, {
      method: "PUT",
      body: JSON.stringify(updates),
    });

    return response.block;
  }

  /**
   * Delete a block file
   */
  async deleteBlock(blockId: string): Promise<boolean> {
    const url = `${this.baseUrl}/${blockId}`;
    const response = await this.fetchWithErrorHandling<{ success: boolean }>(url, {
      method: "DELETE",
    });

    return response.success;
  }

  /**
   * Get current block storage paths from server
   */
  async getBlockPaths(): Promise<{
    srcBlocksPath: string;
    dataBlocksPath: string;
    relativeSrcPath: string;
    relativeDataPath: string;
  }> {
    const url = `${this.baseUrl}/settings/paths`;
    const response = await fetch(url);
    return response.json();
  }
}

// Export singleton instance
export const blockFileApi = new BlockFileApiClient();
