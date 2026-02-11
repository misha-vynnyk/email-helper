import { ASTCache, RegexCache } from "./cache";
import {
  CACHE_SCORING_WEIGHTS,
  EMAIL_DEFAULTS,
  ERROR_MESSAGES,
  PERFORMANCE_CONSTANTS,
  SCORING_CONSTANTS,
} from "./EMAIL_CONSTANTS";
import { SimpleHTMLParser } from "./htmlParser";
import {
  EmailValidationReport,
  EmailValidatorConfig,
  HTMLNode,
  ValidationResult,
  ValidationRule,
} from "./types";
import { EMAIL_VALIDATION_RULES } from "./validationRules";
import { logger } from "../utils/logger";

/**
 * Handles HTML validation logic separately from autofix functionality
 */
export class ValidationEngine {
  private config: EmailValidatorConfig;
  private customRules: Map<string, ValidationRule> = new Map();

  // Enhanced cache for DOM traversal results with automatic cleanup
  private traversalCache = new Map<string, Map<string, HTMLNode[]>>();
  private maxTraversalCacheSize = EMAIL_DEFAULTS.TRAVERSAL_CACHE_SIZE;
  private cacheCleanupTimer?: NodeJS.Timeout;
  private cacheAccessCount = new Map<string, number>();
  private cacheLastAccess = new Map<string, number>();

  constructor(config: EmailValidatorConfig) {
    this.config = config;
    this.startCacheCleanupTimer();
  }

  /**
   * Start automatic cache cleanup timer
   */
  private startCacheCleanupTimer(): void {
    if (this.cacheCleanupTimer) {
      clearTimeout(this.cacheCleanupTimer);
    }

    this.cacheCleanupTimer = setTimeout(() => {
      this.performCacheCleanup();
      this.startCacheCleanupTimer(); // Restart timer
    }, EMAIL_DEFAULTS.CACHE_CLEANUP_INTERVAL_MS);
  }

  /**
   * Perform intelligent cache cleanup
   */
  private performCacheCleanup(): void {
    const now = Date.now();
    let totalCleared = 0;

    // Clean up traversal cache
    for (const [operation] of this.traversalCache.entries()) {
      const operationKey = `traversal_${operation}`;
      const lastAccess = this.cacheLastAccess.get(operationKey) || 0;
      const accessCount = this.cacheAccessCount.get(operationKey) || 0;
      const age = now - lastAccess;

      // Remove old and rarely used cache entries
      if (age > EMAIL_DEFAULTS.CACHE_TTL_MS || accessCount < 2) {
        this.traversalCache.delete(operation);
        this.cacheAccessCount.delete(operationKey);
        this.cacheLastAccess.delete(operationKey);
        totalCleared++;
      }
    }

    // Clean up custom rules cache if too large
    if (this.customRules.size > PERFORMANCE_CONSTANTS.MAX_CUSTOM_RULES_SIZE) {
      const entries = Array.from(this.customRules.entries());
      const toRemove = Math.floor(
        this.customRules.size * PERFORMANCE_CONSTANTS.CACHE_CLEANUP_PERCENTAGE_REDUCED
      );

      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.customRules.delete(entries[i][0]);
      }
      totalCleared += toRemove;
    }

    if (totalCleared > 0) {
      logger.debug("ValidationEngine", `Cache cleanup completed. Cleared ${totalCleared} entries`, {
        totalCleared,
      });
    }
  }

  /**
   * Get or create parsed AST for HTML
   */
  private getParsedAST(html: string): HTMLNode[] | null {
    if (!html || typeof html !== "string") {
      return null;
    }

    try {
      // Check AST cache first
      let ast = ASTCache.get(html);
      if (!ast) {
        const parser = new SimpleHTMLParser(html);
        ast = parser.parse();
        ASTCache.set(html, ast);
      }
      return ast;
    } catch (error) {
      logger.error("ValidationEngine", "Error parsing HTML to AST", error);
      return null;
    }
  }

  /**
   * Enhanced DOM traversal with intelligent caching and memory management
   */
  private getTraversalResult(ast: HTMLNode[], operation: string, key: string): HTMLNode[] {
    const operationKey = `traversal_${operation}`;

    if (!this.traversalCache.has(operation)) {
      this.traversalCache.set(operation, new Map());
    }

    const operationCache = this.traversalCache.get(operation)!;

    if (operationCache.has(key)) {
      // Update access statistics
      this.cacheAccessCount.set(operationKey, (this.cacheAccessCount.get(operationKey) || 0) + 1);
      this.cacheLastAccess.set(operationKey, Date.now());
      return operationCache.get(key)!;
    }

    // Perform traversal and cache result
    let result: HTMLNode[] = [];

    try {
      switch (operation) {
        case "findByTag":
          result = this.findNodesByTagName(ast, key);
          break;
        case "findByAttribute": {
          const [attrName, attrValue] = key.split("=");
          result = this.findNodesByAttribute(ast, attrName, attrValue);
          break;
        }
        case "findByCategory":
          result = this.findNodesByCategory(ast, key);
          break;
        default:
          result = [];
      }

      // Cache result with size limit
      if (result.length <= PERFORMANCE_CONSTANTS.MAX_TRAVERSAL_RESULTS) {
        // Only cache reasonable results
        operationCache.set(key, result);

        // Update access statistics
        this.cacheAccessCount.set(operationKey, 1);
        this.cacheLastAccess.set(operationKey, Date.now());

        // Clean up if cache is too large
        if (operationCache.size > this.maxTraversalCacheSize) {
          this.cleanupOperationCache(operation, operationCache);
        }
      }
    } catch (error) {
      logger.error("ValidationEngine", `Error in traversal operation ${operation}`, error);
      result = [];
    }

    return result;
  }

  /**
   * Clean up specific operation cache
   */
  private cleanupOperationCache(operation: string, operationCache: Map<string, HTMLNode[]>): void {
    const entries = Array.from(operationCache.entries()).map(([key, nodes]) => ({
      key,
      nodes,
      accessCount: this.cacheAccessCount.get(`traversal_${operation}`) || 0,
      lastAccess: this.cacheLastAccess.get(`traversal_${operation}`) || 0,
      size: nodes.length,
    }));

    // Sort by priority: low access + old age + large size = high priority for removal
    entries.sort((a, b) => {
      const aScore =
        a.accessCount * CACHE_SCORING_WEIGHTS.TRAVERSAL_ACCESS_COUNT_WEIGHT +
        ((Date.now() - a.lastAccess) / 1000) * CACHE_SCORING_WEIGHTS.TRAVERSAL_AGE_WEIGHT +
        (a.size / 100) * CACHE_SCORING_WEIGHTS.TRAVERSAL_SIZE_WEIGHT;
      const bScore =
        b.accessCount * CACHE_SCORING_WEIGHTS.TRAVERSAL_ACCESS_COUNT_WEIGHT +
        ((Date.now() - b.lastAccess) / 1000) * CACHE_SCORING_WEIGHTS.TRAVERSAL_AGE_WEIGHT +
        (b.size / 100) * CACHE_SCORING_WEIGHTS.TRAVERSAL_SIZE_WEIGHT;
      return aScore - bScore;
    });

    // Remove oldest/least used entries
    const toRemove = Math.floor(
      operationCache.size * PERFORMANCE_CONSTANTS.CACHE_CLEANUP_PERCENTAGE_LARGE
    );
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      operationCache.delete(entries[i].key);
    }
  }

  /**
   * Find all nodes by tag name with memory optimization
   */
  private findNodesByTagName(ast: HTMLNode[], tagName: string): HTMLNode[] {
    const result: HTMLNode[] = [];
    const maxResults = PERFORMANCE_CONSTANTS.MAX_TRAVERSAL_RESULTS;

    const traverse = (nodes: HTMLNode[]) => {
      for (const node of nodes) {
        if (result.length >= maxResults) break; // Stop if too many results

        if (node.type === "element" && node.tagName === tagName.toLowerCase()) {
          result.push(node);
        }
        if (node.children && Array.isArray(node.children)) {
          traverse(node.children);
        }
      }
    };

    traverse(ast);
    return result;
  }

  /**
   * Find all nodes by attribute with memory optimization
   */
  private findNodesByAttribute(ast: HTMLNode[], attrName: string, attrValue?: string): HTMLNode[] {
    const result: HTMLNode[] = [];
    const maxResults = PERFORMANCE_CONSTANTS.MAX_TRAVERSAL_RESULTS;

    const traverse = (nodes: HTMLNode[]) => {
      for (const node of nodes) {
        if (result.length >= maxResults) break;

        if (node.type === "element" && node.attributes?.[attrName]) {
          if (!attrValue || node.attributes[attrName] === attrValue) {
            result.push(node);
          }
        }
        if (node.children && Array.isArray(node.children)) {
          traverse(node.children);
        }
      }
    };

    traverse(ast);
    return result;
  }

  /**
   * Find all nodes by category with memory optimization
   */
  private findNodesByCategory(ast: HTMLNode[], category: string): HTMLNode[] {
    const result: HTMLNode[] = [];
    const maxResults = PERFORMANCE_CONSTANTS.MAX_TRAVERSAL_RESULTS;

    const traverse = (nodes: HTMLNode[]) => {
      for (const node of nodes) {
        if (result.length >= maxResults) break;

        if (node.type === "element") {
          // Check different categories
          switch (category) {
            case "tables":
              if (node.tagName === "table") result.push(node);
              break;
            case "images":
              if (node.tagName === "img") result.push(node);
              break;
            case "links":
              if (node.tagName === "a") result.push(node);
              break;
            case "headings":
              if (node.tagName && /^h[1-6]$/.test(node.tagName)) result.push(node);
              break;
            case "block-elements":
              if (
                node.tagName &&
                [
                  "div",
                  "p",
                  "section",
                  "article",
                  "nav",
                  "header",
                  "footer",
                  "main",
                  "aside",
                ].includes(node.tagName)
              ) {
                result.push(node);
              }
              break;
            case "dangerous":
              if (
                node.tagName &&
                ["script", "style", "iframe", "embed", "object"].includes(node.tagName)
              ) {
                result.push(node);
              }
              break;
          }
        }
        if (node.children && Array.isArray(node.children)) {
          traverse(node.children);
        }
      }
    };

    traverse(ast);
    return result;
  }

  /**
   * Clear traversal cache with statistics
   */
  private clearTraversalCache(): void {
    const cacheSize = this.traversalCache.size;
    this.traversalCache.clear();
    this.cacheAccessCount.clear();
    this.cacheLastAccess.clear();

    if (cacheSize > 0) {
      logger.debug("ValidationEngine", `Cleared traversal cache with ${cacheSize} operations`, {
        cacheSize,
      });
    }
  }

  /**
   * Validate HTML against email-safe rules
   */
  validate(html: string): EmailValidationReport {
    if (!html || typeof html !== "string") {
      return this.createEmptyReport("Invalid HTML input provided");
    }

    // Prevent validation of extremely large HTML to avoid freezing
    if (html.length > this.config.maxHtmlSize) {
      const maxSizeKB = Math.round(this.config.maxHtmlSize / 1024);
      return this.createEmptyReport(
        `${ERROR_MESSAGES.HTML_TOO_LARGE} (over ${maxSizeKB}KB)`,
        "html-too-large",
        "performance"
      );
    }

    const allResults: ValidationResult[] = [];

    // Parse AST once for all rules that need it
    const ast = this.getParsedAST(html);

    try {
      // Run built-in validation rules
      allResults.push(...this.runBuiltInRules(html, ast));

      // Run custom validation rules
      allResults.push(...this.runCustomRules(html, ast));

      // Process results
      const errors = allResults.filter((r) => r.severity === "error");
      const warnings = allResults.filter((r) => r.severity === "warning");
      const suggestions = allResults.filter((r) => r.severity === "info");

      // Calculate categories
      const categories = this.calculateCategories(allResults);

      // Calculate score (0-100)
      const score = this.calculateValidationScore(allResults);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        autoFixAvailable: allResults.some((r) => r.autoFixAvailable),
        totalIssues: allResults.length,
        categories,
        score,
      };
    } catch (error) {
      logger.error("ValidationEngine", "Critical validation error", error);
      return this.createEmptyReport(
        `Validation system error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "validation-system-error",
        "structure"
      );
    } finally {
      // Clear traversal cache after validation to free memory
      this.clearTraversalCache();
    }
  }

  /**
   * Run built-in validation rules with optimized traversal
   */
  private runBuiltInRules(html: string, ast: HTMLNode[] | null): ValidationResult[] {
    const results: ValidationResult[] = [];

    // Clear traversal cache before new validation
    this.clearTraversalCache();

    for (const [ruleName, rule] of Object.entries(EMAIL_VALIDATION_RULES)) {
      const ruleConfig = this.config.rules[ruleName];

      // Rules are enabled by default unless explicitly disabled
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : rule.enabled;

      if (!isRuleEnabled) {
        continue;
      }

      // Skip rules based on configuration
      if (rule.category === "accessibility" && !this.config.checkAccessibility) {
        continue;
      }
      if (rule.category === "performance" && !this.config.checkPerformance) {
        continue;
      }
      if (rule.category === "best-practice" && !this.config.checkBestPractices) {
        continue;
      }

      try {
        // Use optimized traversal for rules that support AST
        let ruleResults: ValidationResult[] = [];

        if (rule.checkWithAST && ast) {
          // Pass optimized traversal context
          const traversalContext = {
            ast,
            getTraversalResult: (operation: string, key: string) =>
              this.getTraversalResult(ast, operation, key),
            findNodesByTag: (tagName: string) => this.getTraversalResult(ast, "findByTag", tagName),
            findNodesByAttribute: (attrName: string, attrValue?: string) =>
              this.getTraversalResult(ast, "findByAttribute", `${attrName}=${attrValue || ""}`),
            findNodesByCategory: (category: string) =>
              this.getTraversalResult(ast, "findByCategory", category),
          };

          ruleResults = rule.checkWithAST(html, ast, ruleConfig?.config, traversalContext);
        } else {
          ruleResults = rule.check(html, ruleConfig?.config);
        }

        // Override severity if configured
        if (ruleConfig?.severity) {
          ruleResults.forEach((result) => {
            result.severity = ruleConfig.severity!;
          });
        }

        results.push(...ruleResults);
      } catch (error) {
        logger.error("ValidationEngine", `Error running validation rule ${ruleName}`, error);
        results.push({
          rule: ruleName,
          severity: "error",
          message: `Validation rule error: ${error instanceof Error ? error.message : "Unknown error"}`,
          category: rule.category,
        });
      }
    }

    return results;
  }

  /**
   * Run custom validation rules
   */
  private runCustomRules(html: string, ast: HTMLNode[] | null): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const [ruleName, rule] of this.customRules.entries()) {
      const ruleConfig = this.config.rules[ruleName];

      // Custom rules are enabled by default unless explicitly disabled
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : true;

      if (!isRuleEnabled) {
        continue;
      }

      try {
        // Pass AST to custom rules that support it
        const ruleResults =
          rule.checkWithAST && ast
            ? rule.checkWithAST(html, ast, ruleConfig?.config)
            : rule.check(html, ruleConfig?.config);

        if (ruleConfig?.severity) {
          ruleResults.forEach((result) => {
            result.severity = ruleConfig.severity!;
          });
        }

        results.push(...ruleResults);
      } catch (error) {
        logger.error("ValidationEngine", `Error running custom validation rule ${ruleName}`, error);
      }
    }

    return results;
  }

  /**
   * Calculate validation categories
   */
  private calculateCategories(results: ValidationResult[]) {
    return {
      structure: results.filter((r) => r.category === "structure").length,
      accessibility: results.filter((r) => r.category === "accessibility").length,
      compatibility: results.filter((r) => r.category === "compatibility").length,
      performance: results.filter((r) => r.category === "performance").length,
      "best-practice": results.filter((r) => r.category === "best-practice").length,
    };
  }

  /**
   * Calculate validation score (0-100)
   */
  private calculateValidationScore(results: ValidationResult[]): number {
    if (results.length === 0) {
      return SCORING_CONSTANTS.MAX_SCORE;
    }

    let totalPenalty = 0;
    const maxPenalty = SCORING_CONSTANTS.MAX_PENALTY;

    results.forEach((result) => {
      switch (result.severity) {
        case "error":
          totalPenalty += SCORING_CONSTANTS.ERROR_PENALTY;
          break;
        case "warning":
          totalPenalty += SCORING_CONSTANTS.WARNING_PENALTY;
          break;
        case "info":
          totalPenalty += SCORING_CONSTANTS.INFO_PENALTY;
          break;
      }
    });

    const score = Math.max(0, SCORING_CONSTANTS.MAX_SCORE - Math.min(totalPenalty, maxPenalty));
    return Math.round(score);
  }

  /**
   * Create empty validation report
   */
  private createEmptyReport(
    message: string,
    rule: string = "invalid-input",
    category: "structure" | "performance" = "structure"
  ): EmailValidationReport {
    return {
      isValid: false,
      errors: [
        {
          rule,
          severity: "error",
          message,
          category,
        },
      ],
      warnings: [],
      suggestions: [],
      autoFixAvailable: false,
      totalIssues: 1,
      categories: {
        structure: category === "structure" ? 1 : 0,
        accessibility: 0,
        compatibility: 0,
        performance: category === "performance" ? 1 : 0,
        "best-practice": 0,
      },
      score: 0,
    };
  }

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule): void {
    if (!rule || !rule.name) {
      logger.warn("ValidationEngine", "Invalid validation rule provided", rule);
      return;
    }

    this.customRules.set(rule.name, rule);
  }

  /**
   * Remove custom validation rule
   */
  removeRule(ruleName: string): void {
    if (!ruleName) {
      logger.warn("ValidationEngine", "Invalid rule name provided for removal", ruleName);
      return;
    }

    this.customRules.delete(ruleName);
  }

  /**
   * Get available rules
   */
  getAvailableRules(): Record<string, ValidationRule> {
    const allRules: Record<string, ValidationRule> = { ...EMAIL_VALIDATION_RULES };

    this.customRules.forEach((rule, name) => {
      allRules[name] = rule;
    });

    return allRules;
  }

  /**
   * Test specific rule against HTML
   */
  testRule(ruleName: string, html: string): ValidationResult[] {
    if (!ruleName || !html) {
      logger.warn("ValidationEngine", "Invalid parameters for testRule", {
        ruleName,
        html: typeof html,
      });
      return [];
    }

    const rule = EMAIL_VALIDATION_RULES[ruleName] || this.customRules.get(ruleName);

    if (!rule) {
      throw new Error(`Rule "${ruleName}" not found`);
    }

    const ruleConfig = this.config.rules[ruleName];
    return rule.check(html, ruleConfig?.config);
  }

  /**
   * Get email client compatibility report
   */
  getCompatibilityReport(html: string): Record<string, { compatible: boolean; issues: string[] }> {
    if (!html || typeof html !== "string") {
      return {};
    }

    const report: Record<string, { compatible: boolean; issues: string[] }> = {};

    Object.keys(this.config.targetClients).forEach((client) => {
      if (!this.config.targetClients[client as keyof typeof this.config.targetClients]) {
        return;
      }

      const issues: string[] = [];

      // Client-specific checks
      switch (client) {
        case "outlook":
          this.validateOutlookCompatibility(html, issues);
          break;
        case "gmail":
          this.validateGmailCompatibility(html, issues);
          break;
        case "mobile":
          this.validateMobileCompatibility(html, issues);
          break;
        default:
          break;
      }

      report[client] = {
        compatible: issues.length === 0,
        issues,
      };
    });

    return report;
  }

  private validateOutlookCompatibility(html: string, issues: string[]): void {
    // Outlook-specific validation
    if (html.includes("flexbox") || html.includes("display: flex")) {
      issues.push("Flexbox not supported in Outlook");
    }

    if (html.includes("grid") || html.includes("display: grid")) {
      issues.push("CSS Grid not supported in Outlook");
    }

    if (html.includes("position: absolute") || html.includes("position: fixed")) {
      issues.push("Absolute/fixed positioning not supported in Outlook");
    }

    if (html.includes("linear-gradient") || html.includes("radial-gradient")) {
      issues.push("CSS gradients not supported in Outlook");
    }
  }

  private validateGmailCompatibility(html: string, issues: string[]): void {
    // Gmail-specific validation
    if (html.includes("<style>")) {
      issues.push("Gmail may strip <style> tags on mobile");
    }

    if (html.includes("background-image")) {
      issues.push("Background images may not display consistently in Gmail");
    }
  }

  private validateMobileCompatibility(html: string, issues: string[]): void {
    // Mobile-specific validation
    if (html.includes('width="') && !html.includes("max-width")) {
      issues.push("Fixed widths without max-width may cause horizontal scrolling on mobile");
    }

    if (html.includes("font-size:") && html.includes("px")) {
      issues.push("Consider using relative font sizes for better mobile experience");
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): {
    traversalCacheSize: number;
    astCacheStats: { size: number; maxSize: number; ttl: number; oldestEntry: number };
    regexCacheStats: { size: number; maxSize: number; accessCount: number; oldestEntry: number };
  } {
    return {
      traversalCacheSize: this.traversalCache.size,
      astCacheStats: ASTCache.getStats(),
      regexCacheStats: RegexCache.getStats(),
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Clear all caches
    this.clearTraversalCache();
    this.customRules.clear();

    // Clear cleanup timer
    if (this.cacheCleanupTimer) {
      clearTimeout(this.cacheCleanupTimer);
      this.cacheCleanupTimer = undefined;
    }

    logger.debug("ValidationEngine", "Disposed and all caches cleared");
  }
}
