/**
 * Block API Adapter
 * Provides backward compatibility with new centralized API client
 */

import { blockEndpoints, BlockFile } from "../../api/endpoints/blocks";

export interface BlockFileData extends BlockFile {}

export class BlockFileApiClient {
  async listBlocks(search?: string, category?: string): Promise<BlockFileData[]> {
    return blockEndpoints.list({ search, category });
  }

  async getBlock(id: string): Promise<BlockFileData> {
    return blockEndpoints.getById(id);
  }

  async createBlock(data: Partial<BlockFileData>): Promise<BlockFileData> {
    return blockEndpoints.create(data as any);
  }

  async updateBlock(id: string, data: Partial<BlockFileData>): Promise<BlockFileData> {
    return blockEndpoints.update(id, data);
  }

  async deleteBlock(id: string): Promise<void> {
    await blockEndpoints.delete(id);
  }

  async searchBlocks(query: string): Promise<BlockFileData[]> {
    return blockEndpoints.search(query);
  }
}

// Singleton instance for backward compatibility
export const blockFileApi = new BlockFileApiClient();
