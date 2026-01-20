/**
 * API Types
 * Shared types for API responses and requests
 */

// Re-export from api/types for convenience
export type { ApiResponse, ApiError, PaginatedResponse } from "../api/types";

export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

export interface ApiListResponse<T> {
  items: T[];
  count: number;
}
