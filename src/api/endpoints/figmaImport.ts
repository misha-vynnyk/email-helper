/**
 * Figma Import API Endpoints
 */

import { apiClient } from '../client';

export interface FigmaImportFileResult {
  exists: boolean;
  content?: string;
}

export interface FigmaImportFolderResult {
  description: FigmaImportFileResult;
  desktopJson: FigmaImportFileResult;
  mobileJson: FigmaImportFileResult;
}

export const figmaImportEndpoints = {
  readFolder: (folderPath: string) =>
    apiClient.get<FigmaImportFolderResult>(`/api/figma-import/files?folder=${encodeURIComponent(folderPath)}`),
};
