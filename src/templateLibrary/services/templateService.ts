/**
 * Template Service
 * Business logic layer for template operations
 */

import { templateEndpoints, TemplateFile } from "../../api/endpoints/templates";
import { logger } from "../../utils/logger";
import { EmailTemplate } from "../types";

export class TemplateService {
  async listTemplates(filters?: { search?: string; category?: string }): Promise<EmailTemplate[]> {
    try {
      const templates = await templateEndpoints.list(filters);
      return this.transformTemplateFiles(templates);
    } catch (error) {
      logger.error("TemplateService", "Failed to list templates", error);
      throw error;
    }
  }

  async getTemplate(id: string): Promise<EmailTemplate> {
    try {
      const template = await templateEndpoints.getById(id);
      return this.transformTemplateFile(template);
    } catch (error) {
      logger.error("TemplateService", `Failed to get template ${id}`, error);
      throw error;
    }
  }

  async createTemplate(data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const payload = {
        name: data.name || "Untitled Template",
        description: data.description,
        category: data.category || "other",
        keywords: data.keywords || [],
        html: data.html || "",
        preview: data.preview,
        targetPath: data.filePath,
      };
      const template = await templateEndpoints.create(payload);
      return this.transformTemplateFile(template);
    } catch (error) {
      logger.error("TemplateService", "Failed to create template", error);
      throw error;
    }
  }

  async updateTemplate(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const template = await templateEndpoints.update(id, data as Partial<TemplateFile>);
      return this.transformTemplateFile(template);
    } catch (error) {
      logger.error("TemplateService", `Failed to update template ${id}`, error);
      throw error;
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      await templateEndpoints.delete(id);
    } catch (error) {
      logger.error("TemplateService", `Failed to delete template ${id}`, error);
      throw error;
    }
  }

  async searchTemplates(query: string): Promise<EmailTemplate[]> {
    try {
      const templates = await templateEndpoints.list({ search: query });
      return this.transformTemplateFiles(templates);
    } catch (error) {
      logger.error("TemplateService", "Failed to search templates", error);
      throw error;
    }
  }

  async syncTemplate(id: string): Promise<EmailTemplate> {
    try {
      const template = await templateEndpoints.sync(id);
      return this.transformTemplateFile(template);
    } catch (error) {
      logger.error("TemplateService", `Failed to sync template ${id}`, error);
      throw error;
    }
  }

  private transformTemplateFile(file: TemplateFile): EmailTemplate {
    return {
      id: file.id,
      name: file.name,
      description: file.description,
      category: file.category,
      keywords: file.keywords,
      html: file.html,
      preview: file.preview,
      createdAt: file.createdAt || Date.now(),
      updatedAt: file.updatedAt,
      isCustom: true,
      source: this.getTemplateSource(file.filePath),
      filePath: file.filePath,
    };
  }

  private transformTemplateFiles(files: TemplateFile[]): EmailTemplate[] {
    return files.map((file) => this.transformTemplateFile(file));
  }

  private getTemplateSource(filePath: string): "src" | "data" {
    return filePath.includes("/src/templates") ? "src" : "data";
  }
}

export const templateService = new TemplateService();
