/**
 * Centralized API Client
 * Provides unified HTTP methods with error handling and logging
 */

import { logger } from '../utils/logger';
import { getApiBase, isApiAvailable } from '../config/api';

class ApiClient {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // If API is not available, reject immediately without making a request
    if (!isApiAvailable()) {
      const error = new Error('API is not configured. Backend server is not available.');
      logger.warn('ApiClient', `API not available, skipping request: ${endpoint}`);
      throw error;
    }

    try {
      const response = await fetch(`${getApiBase()}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      // Only log errors if API is available (to avoid spamming console with CORS errors)
      if (isApiAvailable()) {
        logger.error('ApiClient', `Request failed: ${endpoint}`, error);
      }
      throw error;
    }
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
