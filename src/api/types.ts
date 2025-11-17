/**
 * API Types
 * Shared types for API responses and requests
 */

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
  timestamp?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiListResponse<T> {
  items: T[];
  count: number;
}
