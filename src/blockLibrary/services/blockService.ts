/**
 * Block Service
 * Business logic layer for block operations
 */

import { blockEndpoints, BlockFile } from "../../api/endpoints/blocks";
import { logger } from "../../utils/logger";
import { EmailBlock } from "../types";

export class BlockService {
  async listBlocks(filters?: { search?: string; category?: string }): Promise<EmailBlock[]> {
    try {
      const blocks = await blockEndpoints.list(filters);
      return this.transformBlockFiles(blocks);
    } catch (error) {
      logger.error("BlockService", "Failed to list blocks", error);
      throw error;
    }
  }

  async getBlock(id: string): Promise<EmailBlock> {
    try {
      const block = await blockEndpoints.getById(id);
      return this.transformBlockFile(block);
    } catch (error) {
      logger.error("BlockService", `Failed to get block ${id}`, error);
      throw error;
    }
  }

  async createBlock(data: Partial<EmailBlock>): Promise<EmailBlock> {
    try {
      const payload = {
        name: data.name || "Untitled Block",
        category: data.category || "other",
        keywords: data.keywords || [],
        html: data.html || "",
        preview: data.preview,
        targetPath: data.filePath,
      };
      const block = await blockEndpoints.create(payload);
      return this.transformBlockFile(block);
    } catch (error) {
      logger.error("BlockService", "Failed to create block", error);
      throw error;
    }
  }

  async updateBlock(id: string, data: Partial<EmailBlock>): Promise<EmailBlock> {
    try {
      const block = await blockEndpoints.update(id, data as Partial<BlockFile>);
      return this.transformBlockFile(block);
    } catch (error) {
      logger.error("BlockService", `Failed to update block ${id}`, error);
      throw error;
    }
  }

  async deleteBlock(id: string): Promise<void> {
    try {
      await blockEndpoints.delete(id);
    } catch (error) {
      logger.error("BlockService", `Failed to delete block ${id}`, error);
      throw error;
    }
  }

  async searchBlocks(query: string): Promise<EmailBlock[]> {
    try {
      const blocks = await blockEndpoints.search(query);
      return this.transformBlockFiles(blocks);
    } catch (error) {
      logger.error("BlockService", "Failed to search blocks", error);
      throw error;
    }
  }

  private transformBlockFile(file: BlockFile): EmailBlock {
    return {
      id: file.id,
      name: file.name,
      category: file.category,
      keywords: file.keywords,
      html: file.html,
      preview: file.preview,
      createdAt: file.createdAt || Date.now(),
      isCustom: true,
      source: this.getBlockSource(file.filePath),
      filePath: file.filePath,
    };
  }

  private transformBlockFiles(files: BlockFile[]): EmailBlock[] {
    return files.map((file) => this.transformBlockFile(file));
  }

  private getBlockSource(filePath: string): "src" | "data" {
    return filePath.includes("/src/blocks") ? "src" : "data";
  }
}

export const blockService = new BlockService();
