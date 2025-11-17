/**
 * Common Shared Types
 */

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt?: number;
}

export interface NamedEntity extends BaseEntity {
  name: string;
  description?: string;
}

export interface CategorizedEntity extends NamedEntity {
  category: string;
  tags?: string[];
  keywords?: string[];
}

export type SortDirection = "asc" | "desc";

export interface SortOptions {
  field: string;
  direction: SortDirection;
}

export interface FilterOptions {
  search?: string;
  category?: string;
  tags?: string[];
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}
