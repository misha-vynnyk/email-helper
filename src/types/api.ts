/**
 * API Types
 * Shared types for API responses and requests
 */

// Re-export from api/types for convenience
export type { ApiError, ApiResponse, PaginatedResponse } from "../api/types";

export interface ApiListResponse<T> {
  items: T[];
  count: number;
}
