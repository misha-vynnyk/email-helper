// Cache classes for email validation to avoid circular dependencies

import { CACHE_SCORING_WEIGHTS, EMAIL_DEFAULTS, PERFORMANCE_CONSTANTS } from "./EMAIL_CONSTANTS";

/**
 * Enhanced RegexCache with better memory management
 */
export class RegexCache {
  private static cache = new Map<string, RegExp>();
  private static maxSize = EMAIL_DEFAULTS.REGEX_CACHE_SIZE;
  private static precompiledPatterns = new Set<string>();
  private static accessCount = new Map<string, number>();
  private static lastAccess = new Map<string, number>();
  private static cleanupTimer?: NodeJS.Timeout;

  static get(pattern: string, flags: string = "gi"): RegExp {
    const key = `${pattern}|${flags}`;

    if (!this.cache.has(key)) {
      // Cleanup if cache is too large
      if (this.cache.size >= this.maxSize) {
        this.performCleanup();
      }

      try {
        const regex = new RegExp(pattern, flags);
        this.cache.set(key, regex);
        this.accessCount.set(key, 1);
        this.lastAccess.set(key, Date.now());

        // Track frequently used patterns
        if (!this.precompiledPatterns.has(pattern)) {
          this.precompiledPatterns.add(pattern);
        }
      } catch (error) {
        // If regex is invalid, return safe fallback
        console.warn(`Invalid regex pattern: ${pattern}`, error);
        this.cache.set(key, new RegExp("(?:)", flags));
        this.accessCount.set(key, 1);
        this.lastAccess.set(key, Date.now());
      }
    } else {
      // Update access statistics
      const currentCount = this.accessCount.get(key) || 0;
      this.accessCount.set(key, currentCount + 1);
      this.lastAccess.set(key, Date.now());
    }

    // Start cleanup timer if not already running
    if (!this.cleanupTimer) {
      this.cleanupTimer = setTimeout(() => {
        this.performCleanup();
        this.cleanupTimer = undefined;
      }, EMAIL_DEFAULTS.CACHE_CLEANUP_INTERVAL_MS);
    }

    return this.cache.get(key)!;
  }

  /**
   * Perform intelligent cache cleanup
   */
  private static performCleanup(): void {
    if (this.cache.size <= this.maxSize * PERFORMANCE_CONSTANTS.CACHE_CLEANUP_THRESHOLD) {
      return; // No cleanup needed
    }

    const entries = Array.from(this.cache.entries()).map(([key, regex]) => ({
      key,
      regex,
      accessCount: this.accessCount.get(key) || 0,
      lastAccess: this.lastAccess.get(key) || 0,
      age: Date.now() - (this.lastAccess.get(key) || 0),
    }));

    // Sort by priority: low access count + old age = high priority for removal
    entries.sort((a, b) => {
      const aScore =
        a.accessCount * CACHE_SCORING_WEIGHTS.REGEX_ACCESS_COUNT_WEIGHT +
        (a.age / 1000) * CACHE_SCORING_WEIGHTS.REGEX_AGE_WEIGHT;
      const bScore =
        b.accessCount * CACHE_SCORING_WEIGHTS.REGEX_ACCESS_COUNT_WEIGHT +
        (b.age / 1000) * CACHE_SCORING_WEIGHTS.REGEX_AGE_WEIGHT;
      return aScore - bScore;
    });

    // Remove oldest/least used entries
    const toRemove = Math.floor(this.cache.size * PERFORMANCE_CONSTANTS.CACHE_CLEANUP_PERCENTAGE);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      const entry = entries[i];
      this.cache.delete(entry.key);
      this.accessCount.delete(entry.key);
      this.lastAccess.delete(entry.key);
    }
  }

  static clear(): void {
    this.cache.clear();
    this.accessCount.clear();
    this.lastAccess.clear();
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  static size(): number {
    return this.cache.size;
  }

  static getStats(): { size: number; maxSize: number; accessCount: number; oldestEntry: number } {
    const oldestEntry = Math.min(...Array.from(this.lastAccess.values()));
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      accessCount: Array.from(this.accessCount.values()).reduce((sum, count) => sum + count, 0),
      oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
    };
  }
}

import { HTMLNode } from "./types";

/**
 * Enhanced ASTCache with better memory management and cleanup
 */
export class ASTCache {
  private static cache = new Map<
    string,
    { ast: HTMLNode[]; timestamp: number; accessCount: number }
  >();
  private static maxSize = EMAIL_DEFAULTS.AST_CACHE_SIZE;
  private static ttl = EMAIL_DEFAULTS.CACHE_TTL_MS;
  private static cleanupTimer?: NodeJS.Timeout;

  static get(html: string): HTMLNode[] | undefined {
    const hash = this.hashCode(html);
    const entry = this.cache.get(hash);

    if (!entry) return undefined;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(hash);
      return undefined;
    }

    // Update access count
    entry.accessCount++;

    // Start cleanup timer if not already running
    if (!this.cleanupTimer) {
      this.cleanupTimer = setTimeout(() => {
        this.clearExpired();
        this.cleanupTimer = undefined;
      }, EMAIL_DEFAULTS.CACHE_CLEANUP_INTERVAL_MS);
    }

    return entry.ast;
  }

  static set(html: string, ast: HTMLNode[]): void {
    const hash = this.hashCode(html);

    // Clear oldest entries if cache is too large
    if (this.cache.size >= this.maxSize) {
      this.performCleanup();
    }

    this.cache.set(hash, {
      ast,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  static clear(): void {
    this.cache.clear();
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  static size(): number {
    return this.cache.size;
  }

  /**
   * Clear expired entries and perform intelligent cleanup
   */
  static clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    // Collect keys to delete to avoid modification during iteration
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    }

    // Remove expired entries
    for (const key of keysToDelete) {
      this.cache.delete(key);
      cleared++;
    }

    // If still too large, perform additional cleanup
    if (this.cache.size > this.maxSize * PERFORMANCE_CONSTANTS.CACHE_CLEANUP_THRESHOLD) {
      this.performCleanup();
    }

    return cleared;
  }

  /**
   * Perform intelligent cleanup based on access patterns
   */
  private static performCleanup(): void {
    if (this.cache.size <= this.maxSize * PERFORMANCE_CONSTANTS.CACHE_CLEANUP_THRESHOLD) {
      return;
    }

    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      ...entry,
      age: Date.now() - entry.timestamp,
    }));

    // Sort by priority: low access count + old age = high priority for removal
    entries.sort((a, b) => {
      const aScore =
        a.accessCount * CACHE_SCORING_WEIGHTS.AST_ACCESS_COUNT_WEIGHT +
        (a.age / 1000) * CACHE_SCORING_WEIGHTS.AST_AGE_WEIGHT;
      const bScore =
        b.accessCount * CACHE_SCORING_WEIGHTS.AST_ACCESS_COUNT_WEIGHT +
        (b.age / 1000) * CACHE_SCORING_WEIGHTS.AST_AGE_WEIGHT;
      return aScore - bScore;
    });

    // Remove oldest/least used entries
    const toRemove = Math.floor(this.cache.size * PERFORMANCE_CONSTANTS.CACHE_CLEANUP_PERCENTAGE);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i].key);
    }
  }

  private static hashCode(str: string): string {
    if (str.length === 0) return "0";

    // Use more reliable hashing algorithm
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Add string length to reduce collisions
    return `${Math.abs(hash)}_${str.length}`;
  }

  static getStats(): { size: number; maxSize: number; ttl: number; oldestEntry: number } {
    const oldestEntry = Math.min(...Array.from(this.cache.values()).map((e) => e.timestamp));
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
    };
  }
}

/**
 * Enhanced StringBatcher with memory optimization
 */
export class StringBatcher {
  private operations: Array<{ pattern: RegExp; replacement: string }> = [];
  private maxOperations = PERFORMANCE_CONSTANTS.MAX_STRING_BATCHER_OPERATIONS;

  add(pattern: RegExp, replacement: string): StringBatcher {
    // Prevent adding too many operations
    if (this.operations.length >= this.maxOperations) {
      this.execute(""); // Execute current batch to free memory
    }

    this.operations.push({ pattern, replacement });
    return this;
  }

  execute(html: string): string {
    let result = html;

    try {
      for (const op of this.operations) {
        result = result.replace(op.pattern, op.replacement);
      }
    } catch (error) {
      console.warn("StringBatcher execution error:", error);
      // Return original HTML on error
      return html;
    } finally {
      this.clear(); // Always clear operations after execution
    }

    return result;
  }

  clear(): void {
    this.operations = [];
  }

  getOperationCount(): number {
    return this.operations.length;
  }
}
