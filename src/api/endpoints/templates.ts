/**
 * Template API Endpoints
 */

import { apiClient } from '../client';

export interface TemplateFile {
  id: string;
  name: string;
  description?: string;
  category: string;
  keywords: string[];
  html: string;
  preview?: string;
  createdAt?: number;
  updatedAt?: number;
  filePath: string;
}

export interface TemplateFilters {
  search?: string;
  category?: string;
  keywords?: string[];
}

export interface CreateTemplatePayload {
  name: string;
  category: string;
  keywords: string[];
  html: string;
  preview?: string;
  targetPath?: string;
  description?: string;
}

export const templateEndpoints = {
  list: (filters?: TemplateFilters) => {
    const qs = new URLSearchParams();
    if (filters?.search) qs.set("search", filters.search);
    if (filters?.category) qs.set("category", filters.category);
    if (filters?.keywords?.length) {
      for (const kw of filters.keywords) {
        if (kw) qs.append("keywords", kw);
      }
    }
    const suffix = qs.toString();
    return apiClient.get<TemplateFile[]>(`/api/templates/list${suffix ? `?${suffix}` : ""}`);
  },

  getById: (id: string) =>
    apiClient.get<TemplateFile>(`/api/templates/${id}`),

  getContent: (id: string) =>
    apiClient.get<string>(`/api/templates/${id}/content`),

  create: (data: CreateTemplatePayload) =>
    apiClient.post<TemplateFile>('/api/templates', data),

  update: (id: string, data: Partial<TemplateFile>) =>
    apiClient.put<TemplateFile>(`/api/templates/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/api/templates/${id}`),

  sync: (id: string) =>
    apiClient.post<TemplateFile>(`/api/templates/${id}/sync`),

  syncAll: (options?: { recursive?: boolean; category?: string; paths?: string[] }) =>
    apiClient.post('/api/templates/sync-all', options),
};
