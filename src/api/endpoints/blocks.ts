/**
 * Block API Endpoints
 */

import { apiClient } from '../client';

export interface BlockFile {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  html: string;
  preview: string;
  createdAt?: number;
  filePath: string;
}

export interface BlockFilters {
  search?: string;
  category?: string;
}

export interface CreateBlockPayload {
  name: string;
  category: string;
  keywords: string[];
  html: string;
  preview?: string;
  targetPath?: string;
}

export const blockEndpoints = {
  list: (filters?: BlockFilters) =>
    apiClient.get<BlockFile[]>('/api/blocks/list', { params: filters } as any),

  getById: (id: string) =>
    apiClient.get<BlockFile>(`/api/blocks/${id}`),

  create: (data: CreateBlockPayload) =>
    apiClient.post<BlockFile>('/api/blocks', data),

  update: (id: string, data: Partial<BlockFile>) =>
    apiClient.put<BlockFile>(`/api/blocks/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/api/blocks/${id}`),

  search: (query: string) =>
    apiClient.get<BlockFile[]>('/api/blocks/search', { params: { q: query } } as any),
};
