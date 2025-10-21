import { AutofixEngine } from "./AutofixEngine";
import {
  EMAIL_DEFAULTS,
  ERROR_MESSAGES,
  LOGGING_CONSTANTS,
  PERFORMANCE_CONSTANTS,
} from "./EMAIL_CONSTANTS";
import {
  EmailValidationReport,
  EmailValidatorConfig,
  ValidationResult,
  ValidationRule,
  ValidationSeverity,
} from "./types";
import { ValidationEngine } from "./ValidationEngine";
import { EMAIL_VALIDATION_RULES } from "./validationRules";

export class EmailHTMLValidator {
  private config: EmailValidatorConfig;
  private validationEngine: ValidationEngine;
  private autofixEngine: AutofixEngine;
  private cleanupInterval?: NodeJS.Timeout;
  private isDisposed = false;
  private validationStats = {
    totalValidations: 0,
    successfulValidations: 0,
    totalAutoFixes: 0,
    successfulAutoFixes: 0,
    lastValidationTime: 0,
    lastAutoFixTime: 0,
  };

  constructor(config?: Partial<EmailValidatorConfig>) {
    this.config = {
      rules: {},
      targetClients: {
        outlook: true,
        gmail: true,
        applemail: true,
        thunderbird: true,
        mobile: true,
      },
      strictMode: false,
      allowModernCSS: false,
      maxTableNesting: EMAIL_DEFAULTS.MAX_TABLE_NESTING,
      checkAccessibility: true,
      checkPerformance: true,
      checkBestPractices: true,
      maxFileSize: EMAIL_DEFAULTS.MAX_FILE_SIZE_KB,
      maxHtmlSize: EMAIL_DEFAULTS.MAX_HTML_SIZE_BYTES,
      requireAltText: true,
      requireFallbacks: true,
      ...config,
    };

    // Enable all rules by default if not explicitly configured
    this.initializeDefaultRules();

    // Initialize engines
    this.validationEngine = new ValidationEngine(this.config);
    this.autofixEngine = new AutofixEngine(this.config);

    // Setup periodic cache cleanup with error handling
    this.setupCleanupInterval();
  }

  /**
   * Setup cleanup interval with error handling
   */
  private setupCleanupInterval(): void {
    try {
      this.cleanupInterval = setInterval(() => {
        this.performPeriodicCleanup();
      }, EMAIL_DEFAULTS.CACHE_CLEANUP_INTERVAL_MS);
    } catch (error) {
      console.error("Failed to setup cleanup interval", error, "EmailHTMLValidator");
    }
  }

  /**
   * Perform periodic cleanup with error handling
   */
  private performPeriodicCleanup(): void {
    try {
      if (this.isDisposed) return;

      // Perform cleanup on engines
      const validationStats = this.validationEngine.getCacheStats();
      const autofixStats = this.autofixEngine.getFixHistoryStats();

      console.log(
        `${LOGGING_CONSTANTS.CACHE_CLEANUP_PREFIX}`,
        {
          validationCache: validationStats,
          autofixHistory: autofixStats,
        },
        "EmailHTMLValidator"
      );

      // Force garbage collection if available (Node.js only)
      if (typeof global !== "undefined" && (global as { gc?: () => void }).gc) {
        try {
          (global as { gc: () => void }).gc();
          console.log(`${LOGGING_CONSTANTS.GARBAGE_COLLECTION_PREFIX}`, {}, "EmailHTMLValidator");
        } catch (error) {
          // Ignore GC errors
        }
      }
    } catch (error) {
      console.error("Error during periodic cleanup", error, "EmailHTMLValidator");
    }
  }

  /**
   * Initialize default rule configuration
   */
  private initializeDefaultRules(): void {
    // Enable all rules by default based on their default enabled state
    // unless explicitly overridden in config
    Object.entries(EMAIL_VALIDATION_RULES).forEach(([ruleName, rule]) => {
      if (!this.config.rules[ruleName]) {
        // Use the rule's default enabled state, but enable all by default for email validation
        this.config.rules[ruleName] = {
          enabled: rule.enabled !== false, // Enable unless explicitly disabled
        };
      }
    });

    // Force enable specific important rules
    const importantRules = [
      "email-safe-tags",
      "table-attributes",
      "heading-tags",
      "paragraph-tags",
      "block-element-tags",
      "dangerous-tags",
      "email-safe-links",
      "malformed-attributes",
    ];

    importantRules.forEach((ruleName) => {
      if (EMAIL_VALIDATION_RULES[ruleName]) {
        this.config.rules[ruleName] = { enabled: true };
      }
    });
  }

  /**
   * Validate HTML against email-safe rules with enhanced error handling
   */
  validate(html: string): EmailValidationReport {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    const startTime = Date.now();
    this.validationStats.totalValidations++;

    try {
      // Basic input validation
      if (!html || typeof html !== "string") {
        throw new Error(ERROR_MESSAGES.INVALID_HTML_INPUT);
      }

      if (html.length > this.config.maxHtmlSize) {
        const maxSizeKB = Math.round(this.config.maxHtmlSize / 1024);
        const currentSizeKB = Math.round(html.length / 1024);
        throw new Error(
          `${ERROR_MESSAGES.HTML_TOO_LARGE}: ${currentSizeKB}KB exceeds limit of ${maxSizeKB}KB`
        );
      }

      // Perform validation
      const report = this.validationEngine.validate(html);

      // Update statistics
      this.validationStats.successfulValidations++;
      this.validationStats.lastValidationTime = Date.now();

      // Log validation performance
      const duration = Date.now() - startTime;
      if (duration > PERFORMANCE_CONSTANTS.SLOW_VALIDATION_THRESHOLD_MS) {
        // Log slow validations
        console.warn(
          `${LOGGING_CONSTANTS.SLOW_OPERATION_PREFIX}: ${duration}ms for ${html.length} bytes`,
          {
            duration,
            htmlSize: html.length,
            issues: report.totalIssues,
          },
          "EmailHTMLValidator"
        );
      }

      return report;
    } catch (error) {
      // Update statistics
      this.validationStats.lastValidationTime = Date.now();

      // Log error and return error report
      console.error(`${ERROR_MESSAGES.VALIDATION_FAILED}`, error, "EmailHTMLValidator");

      const errorMessage = error instanceof Error ? error.message : "Unknown validation error";
      return {
        isValid: false,
        errors: [
          {
            rule: "validation-error",
            severity: "error" as ValidationSeverity,
            message: `${ERROR_MESSAGES.VALIDATION_FAILED}: ${errorMessage}`,
            category: "structure",
          },
        ],
        warnings: [],
        suggestions: [],
        autoFixAvailable: false,
        totalIssues: 1,
        categories: {
          structure: 1,
          accessibility: 0,
          compatibility: 0,
          performance: 0,
          "best-practice": 0,
        },
        score: 0,
      };
    }
  }

  /**
   * Attempt to automatically fix HTML with enhanced error handling
   */
  autoFix(html: string): { html: string; fixed: string[] } {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    const startTime = Date.now();
    this.validationStats.totalAutoFixes++;

    try {
      // Basic input validation
      if (!html || typeof html !== "string") {
        throw new Error(ERROR_MESSAGES.INVALID_HTML_INPUT);
      }

      if (html.length > this.config.maxHtmlSize) {
        const maxSizeKB = Math.round(this.config.maxHtmlSize / 1024);
        const currentSizeKB = Math.round(html.length / 1024);
        throw new Error(
          `${ERROR_MESSAGES.HTML_TOO_LARGE_FOR_AUTOFIX}: ${currentSizeKB}KB exceeds limit of ${maxSizeKB}KB`
        );
      }

      // Perform autofix
      const result = this.autofixEngine.autoFix(html);

      // Update statistics
      this.validationStats.successfulAutoFixes++;
      this.validationStats.lastAutoFixTime = Date.now();

      // Log autofix performance
      const duration = Date.now() - startTime;
      if (duration > PERFORMANCE_CONSTANTS.SLOW_AUTOFIX_THRESHOLD_MS) {
        // Log slow autofixes
        console.warn(
          `${LOGGING_CONSTANTS.SLOW_OPERATION_PREFIX}: ${duration}ms for ${html.length} bytes`,
          {
            duration,
            htmlSize: html.length,
            fixedRules: result.fixed.length,
          },
          "EmailHTMLValidator"
        );
      }

      return result;
    } catch (error) {
      // Update statistics
      this.validationStats.lastAutoFixTime = Date.now();

      // Log error and return original HTML
      console.error(`${ERROR_MESSAGES.AUTOFIX_FAILED}`, error, "EmailHTMLValidator");

      return { html, fixed: [] };
    }
  }

  /**
   * Fix a specific issue by rule name with error handling
   */
  autoFixSpecificIssue(html: string, ruleName: string): { html: string; fixed: boolean } {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      return this.autofixEngine.autoFixSpecificIssue(html, ruleName);
    } catch (error) {
      console.error(
        `Error fixing specific issue with rule ${ruleName}`,
        error,
        "EmailHTMLValidator"
      );
      return { html, fixed: false };
    }
  }

  /**
   * Fix multiple specific issues by rule names with error handling
   */
  autoFixMultipleIssues(html: string, ruleNames: string[]): { html: string; fixed: string[] } {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      return this.autofixEngine.autoFixMultipleIssues(html, ruleNames);
    } catch (error) {
      console.error("Error fixing multiple issues", error, "EmailHTMLValidator");
      return { html, fixed: [] };
    }
  }

  /**
   * Fix all issues of a specific severity level with error handling
   */
  autoFixAllIssues(html: string, severity: ValidationSeverity): { html: string; fixed: string[] } {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      return this.autofixEngine.autoFixAllIssues(html, severity);
    } catch (error) {
      console.error(`Error fixing all ${severity} issues`, error, "EmailHTMLValidator");
      return { html, fixed: [] };
    }
  }

  /**
   * Fix all issues of a specific category with error handling
   */
  autoFixCategory(html: string, category: string): { html: string; fixed: string[] } {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      return this.autofixEngine.autoFixCategory(html, category);
    } catch (error) {
      console.error(`Error fixing category ${category} issues`, error, "EmailHTMLValidator");
      return { html, fixed: [] };
    }
  }

  /**
   * Get available auto-fix rules
   */
  getAutoFixableRules(): string[] {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      return this.autofixEngine.getAutoFixableRules();
    } catch (error) {
      console.error("Error getting auto-fixable rules", error, "EmailHTMLValidator");
      return [];
    }
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): string[] {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      return this.autofixEngine.getRulesByCategory(category);
    } catch (error) {
      console.error(`Error getting rules for category ${category}`, error, "EmailHTMLValidator");
      return [];
    }
  }

  /**
   * Add custom validation rule with error handling
   */
  addRule(rule: ValidationRule): void {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      this.validationEngine.addRule(rule);
      this.autofixEngine.addRule(rule);
      console.log(`Custom rule added: ${rule.name}`, {}, "EmailHTMLValidator");
    } catch (error) {
      console.error(`Error adding custom rule ${rule.name}`, error, "EmailHTMLValidator");
      throw error;
    }
  }

  /**
   * Remove custom validation rule with error handling
   */
  removeRule(ruleName: string): void {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      this.validationEngine.removeRule(ruleName);
      this.autofixEngine.removeRule(ruleName);
      console.log(`Custom rule removed: ${ruleName}`, {}, "EmailHTMLValidator");
    } catch (error) {
      console.error(`Error removing custom rule ${ruleName}`, error, "EmailHTMLValidator");
      throw error;
    }
  }

  /**
   * Update validator configuration with validation
   */
  updateConfig(newConfig: Partial<EmailValidatorConfig>): void {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      // Validate new configuration
      if (newConfig.maxHtmlSize && newConfig.maxHtmlSize <= 0) {
        throw new Error("maxHtmlSize must be positive");
      }

      if (newConfig.maxFileSize && newConfig.maxFileSize <= 0) {
        throw new Error("maxFileSize must be positive");
      }

      // Update configuration
      this.config = {
        ...this.config,
        ...newConfig,
        rules: {
          ...this.config.rules,
          ...newConfig.rules,
        },
        targetClients: {
          ...this.config.targetClients,
          ...newConfig.targetClients,
        },
      };

      // Reinitialize engines with new config
      this.validationEngine.dispose();
      this.autofixEngine.dispose();

      this.validationEngine = new ValidationEngine(this.config);
      this.autofixEngine = new AutofixEngine(this.config);

      console.log("Configuration updated successfully", { newConfig }, "EmailHTMLValidator");
    } catch (error) {
      console.error("Error updating configuration", error, "EmailHTMLValidator");
      throw error;
    }
  }

  /**
   * Enable/disable specific rule with validation
   */
  setRuleEnabled(ruleName: string, enabled: boolean): void {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    if (!ruleName) {
      throw new Error(ERROR_MESSAGES.INVALID_RULE_NAME);
    }

    try {
      if (!this.config.rules[ruleName]) {
        this.config.rules[ruleName] = { enabled };
      } else {
        this.config.rules[ruleName].enabled = enabled;
      }

      console.log(`Rule ${ruleName} ${enabled ? "enabled" : "disabled"}`, {}, "EmailHTMLValidator");
    } catch (error) {
      console.error(`Error setting rule ${ruleName} enabled state`, error, "EmailHTMLValidator");
      throw error;
    }
  }

  /**
   * Change rule severity with validation
   */
  setRuleSeverity(ruleName: string, severity: ValidationSeverity): void {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    if (!ruleName || !severity) {
      throw new Error("Rule name and severity are required");
    }

    if (!["error", "warning", "info"].includes(severity)) {
      throw new Error(ERROR_MESSAGES.INVALID_SEVERITY);
    }

    try {
      if (!this.config.rules[ruleName]) {
        this.config.rules[ruleName] = { enabled: true, severity };
      } else {
        this.config.rules[ruleName].severity = severity;
      }

      console.log(`Rule ${ruleName} severity set to ${severity}`, {}, "EmailHTMLValidator");
    } catch (error) {
      console.error(`Error setting rule ${ruleName} severity`, error, "EmailHTMLValidator");
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EmailValidatorConfig {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    return { ...this.config };
  }

  /**
   * Get available rules
   */
  getAvailableRules(): Record<string, ValidationRule> {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      return this.validationEngine.getAvailableRules();
    } catch (error) {
      console.error("Error getting available rules", error, "EmailHTMLValidator");
      return {};
    }
  }

  /**
   * Test specific rule against HTML with error handling
   */
  testRule(ruleName: string, html: string): ValidationResult[] {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      return this.validationEngine.testRule(ruleName, html);
    } catch (error) {
      console.error(`Error testing rule ${ruleName}`, error, "EmailHTMLValidator");
      return [];
    }
  }

  /**
   * Get email client compatibility report with error handling
   */
  getCompatibilityReport(html: string): Record<string, { compatible: boolean; issues: string[] }> {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    try {
      return this.validationEngine.getCompatibilityReport(html);
    } catch (error) {
      console.error("Error generating compatibility report", error, "EmailHTMLValidator");
      return {};
    }
  }

  /**
   * Get validation and autofix statistics
   */
  getStats() {
    try {
      return {
        validation: { ...this.validationStats },
        cache: {
          validation: this.validationEngine.getCacheStats(),
          autofix: this.autofixEngine.getFixHistoryStats(),
        },
        isDisposed: this.isDisposed,
      };
    } catch (error) {
      console.error("Error getting statistics", error, "EmailHTMLValidator");
      return {
        validation: this.validationStats,
        cache: { validation: {}, autofix: {} },
        isDisposed: this.isDisposed,
      };
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    if (this.isDisposed) {
      throw new Error(ERROR_MESSAGES.VALIDATOR_DISPOSED);
    }

    this.validationStats = {
      totalValidations: 0,
      successfulValidations: 0,
      totalAutoFixes: 0,
      successfulAutoFixes: 0,
      lastValidationTime: 0,
      lastAutoFixTime: 0,
    };

    console.log(`${LOGGING_CONSTANTS.STATISTICS_RESET_PREFIX}`, {}, "EmailHTMLValidator");
  }

  /**
   * Cleanup resources with enhanced error handling
   */
  dispose(): void {
    if (this.isDisposed) {
      return; // Already disposed
    }

    try {
      // Clear configuration
      this.config.rules = {};

      // Dispose engines
      this.validationEngine.dispose();
      this.autofixEngine.dispose();

      // Clear cleanup interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = undefined;
      }

      // Mark as disposed
      this.isDisposed = true;

      console.log(
        `EmailHTMLValidator ${LOGGING_CONSTANTS.DISPOSAL_PREFIX}`,
        {},
        "EmailHTMLValidator"
      );
    } catch (error) {
      console.error("Error during disposal", error, "EmailHTMLValidator");
      // Mark as disposed even if cleanup fails
      this.isDisposed = true;
    }
  }

  /**
   * Check if validator is disposed
   */
  isDisposedValidator(): boolean {
    return this.isDisposed;
  }
}

// Default validator instance
export const defaultEmailValidator = new EmailHTMLValidator({
  strictMode: false,
  targetClients: {
    outlook: true,
    gmail: true,
    applemail: true,
    thunderbird: false,
    mobile: true,
  },
  checkAccessibility: true,
  checkPerformance: true,
  checkBestPractices: true,
  maxFileSize: EMAIL_DEFAULTS.MAX_FILE_SIZE_KB,
  maxHtmlSize: EMAIL_DEFAULTS.MAX_HTML_SIZE_BYTES,
  requireAltText: true,
  requireFallbacks: true,
});
