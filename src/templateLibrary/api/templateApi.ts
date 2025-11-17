/**
 * Template API Adapter
 * Provides backward compatibility with new centralized API client
 */

import { templateEndpoints, TemplateFile } from "../../api/endpoints/templates";

export interface TemplateFileData extends TemplateFile {}

export class TemplateFileApiClient {
  async listTemplates(search?: string, category?: string): Promise<TemplateFileData[]> {
    return templateEndpoints.list({ search, category });
  }

  async getTemplate(id: string): Promise<TemplateFileData> {
    return templateEndpoints.getById(id);
  }

  async createTemplate(data: Partial<TemplateFileData>): Promise<TemplateFileData> {
    return templateEndpoints.create(data as any);
  }

  async updateTemplate(id: string, data: Partial<TemplateFileData>): Promise<TemplateFileData> {
    return templateEndpoints.update(id, data);
  }

  async deleteTemplate(id: string): Promise<void> {
    await templateEndpoints.delete(id);
  }

  async searchTemplates(query: string): Promise<TemplateFileData[]> {
    return templateEndpoints.list({ search: query });
  }

  async syncTemplate(id: string): Promise<TemplateFileData> {
    return templateEndpoints.sync(id);
  }
}

// Singleton instance for backward compatibility
export const templateFileApi = new TemplateFileApiClient();
