import { ERROR_MESSAGES, PERFORMANCE_CONSTANTS, TIME_CONSTANTS } from "./EMAIL_CONSTANTS";
import { EmailValidatorConfig, ValidationRule, ValidationSeverity } from "./types";
import { EMAIL_VALIDATION_RULES } from "./validationRules";
import { logger } from "../utils/logger";

/**
 * Handles HTML autofix logic separately from validation functionality
 */
export class AutofixEngine {
  private config: EmailValidatorConfig;
  private customRules: Map<string, ValidationRule> = new Map();
  private fixHistory: Map<string, { timestamp: number; iterations: number; success: boolean }> =
    new Map();
  private maxFixHistorySize = PERFORMANCE_CONSTANTS.MAX_FIX_HISTORY_SIZE;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: EmailValidatorConfig) {
    this.config = config;
    this.startCleanupTimer();
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }

    this.cleanupTimer = setTimeout(() => {
      this.performCleanup();
      this.startCleanupTimer(); // Restart timer
    }, TIME_CONSTANTS.TEN_MINUTES_MS);
  }

  /**
   * Perform cleanup of old fix history
   */
  private performCleanup(): void {
    const now = Date.now();
    const maxAge = PERFORMANCE_CONSTANTS.MAX_FIX_HISTORY_AGE_MS;
    let cleared = 0;

    for (const [key, entry] of this.fixHistory.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.fixHistory.delete(key);
        cleared++;
      }
    }

    // If still too large, remove oldest entries
    if (this.fixHistory.size > this.maxFixHistorySize) {
      const entries = Array.from(this.fixHistory.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );
      const toRemove = Math.floor(
        this.fixHistory.size * PERFORMANCE_CONSTANTS.CACHE_CLEANUP_PERCENTAGE
      );

      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.fixHistory.delete(entries[i][0]);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.debug(
        "AutofixEngine",
        `Cleanup completed. Cleared ${cleared} history entries`,
        { cleared }
      );
    }
  }

  /**
   * Attempt to automatically fix HTML with enhanced logic for complete fixes
   */
  autoFix(html: string): { html: string; fixed: string[] } {
    if (!html || typeof html !== "string") {
      return { html: "", fixed: [] };
    }

    // Prevent autofix of extremely large HTML to avoid freezing
    if (html.length > this.config.maxHtmlSize) {
      const maxSizeKB = Math.round(this.config.maxHtmlSize / 1024);
      const currentSizeKB = Math.round(html.length / 1024);
      logger.warn(
        "AutofixEngine",
        `${ERROR_MESSAGES.HTML_TOO_LARGE_FOR_AUTOFIX} (${currentSizeKB}KB > ${maxSizeKB}KB), skipping to prevent freezing`,
        { size: html.length, limit: this.config.maxHtmlSize }
      );
      return { html, fixed: [] };
    }

    let fixedHtml = html;
    const fixedRules: string[] = [];
    const maxPasses = PERFORMANCE_CONSTANTS.MAX_AUTOFIX_PASSES;
    let totalChanges = 0;

    try {
      // Comprehensive rule order for maximum effectiveness
      const ruleOrder = [
        // Phase 1: Structure cleanup (most important first)
        "dangerous-tags",
        "heading-tags",
        "paragraph-tags",
        "block-element-tags",

        // Phase 2: Tag formatting
        "email-safe-tags",
        "malformed-attributes",

        // Phase 3: Attributes and links
        "email-safe-links",
        "image-alt-attributes",
        "table-attributes",
        "email-unsafe-attributes",

        // Phase 4: Style cleanup
        "duplicate-styles",

        // Phase 5: Final cleanup
        "table-nesting-cleanup",
        "empty-elements-cleanup",
      ];

      // Multiple passes to ensure all fixes are applied
      for (let pass = 0; pass < maxPasses; pass++) {
        let passChanges = 0;
        const previousHtml = fixedHtml;

        // Apply all rules in order during this pass
        for (const ruleName of ruleOrder) {
          const { html: resultHtml, fixed } = this.applySingleFix(fixedHtml, ruleName);

          if (fixed) {
            fixedHtml = resultHtml;
            if (!fixedRules.includes(ruleName)) {
              fixedRules.push(ruleName);
            }
            passChanges++;
            totalChanges++;

            // Safety check for HTML size
            if (
              fixedHtml.length >
              html.length * PERFORMANCE_CONSTANTS.MAX_HTML_SIZE_INCREASE_MULTIPLIER
            ) {
              logger.warn(
                "AutofixEngine",
                `HTML size increased too much during autofix, stopping pass ${pass + 1}`,
                { originalSize: html.length, newSize: fixedHtml.length, pass: pass + 1 }
              );
              break;
            }
          }
        }

        // Apply remaining rules not in the ordered list
        const remainingFixes = this.applyRemainingFixes(
          fixedHtml,
          ruleOrder,
          fixedRules,
          PERFORMANCE_CONSTANTS.MAX_AUTOFIX_ITERATIONS
        );
        if (remainingFixes.iterations > 0) {
          fixedHtml = remainingFixes.html;
          passChanges += remainingFixes.iterations;
          totalChanges += remainingFixes.iterations;
        }

        // Apply custom rules
        const customFixes = this.applyCustomFixes(
          fixedHtml,
          fixedRules,
          PERFORMANCE_CONSTANTS.MAX_AUTOFIX_ITERATIONS
        );
        if (customFixes.iterations > 0) {
          fixedHtml = customFixes.html;
          passChanges += customFixes.iterations;
          totalChanges += customFixes.iterations;
        }

        logger.debug(
          "AutofixEngine",
          `Pass ${pass + 1}: Applied ${passChanges} fixes`,
          { pass: pass + 1, changes: passChanges }
        );

        // If no changes in this pass, we're done
        if (passChanges === 0 || fixedHtml === previousHtml) {
          logger.debug(
            "AutofixEngine",
            `No more changes after pass ${pass + 1}, stopping`,
            { totalPasses: pass + 1 }
          );
          break;
        }
      }

      // Record fix history
      this.recordFixHistory(html, fixedRules, totalChanges, true);

      if (fixedRules.length > 0) {
        logger.debug(
          "AutofixEngine",
          `Auto-fix completed with ${totalChanges} total changes. Fixed ${fixedRules.length} rule types: ${fixedRules.join(", ")}`,
          { totalChanges, fixedRules }
        );
      } else {
        logger.debug("AutofixEngine", "No auto-fixes were applied");
      }

      return {
        html: fixedHtml,
        fixed: fixedRules,
      };
    } catch (error) {
      logger.error("AutofixEngine", "Critical auto-fix error", error);
      this.recordFixHistory(html, fixedRules, totalChanges, false);
      return { html, fixed: [] };
    }
  }

  /**
   * Apply single fix with memory optimization
   */
  private applySingleFix(html: string, ruleName: string): { html: string; fixed: boolean } {
    const rule = EMAIL_VALIDATION_RULES[ruleName];
    const ruleConfig = this.config.rules[ruleName];

    // Rules are enabled by default unless explicitly disabled
    const isRuleEnabled = ruleConfig ? ruleConfig.enabled : rule.enabled;

    if (!isRuleEnabled || !rule.autofix) {
      return { html, fixed: false };
    }

    try {
      const beforeFix = html;
      const afterFix = rule.autofix(html);

      // Check if fix actually changed something
      if (beforeFix !== afterFix) {
        // Validate that fix didn't break HTML structure
        if (this.isValidHTMLStructure(afterFix)) {
          return { html: afterFix, fixed: true };
        } else {
          logger.warn("AutofixEngine", `Fix for rule ${ruleName} produced invalid HTML, reverting`);
          return { html, fixed: false };
        }
      }

      return { html, fixed: false };
    } catch (error) {
      logger.error("AutofixEngine", `Error applying auto-fix for rule ${ruleName}`, error);
      return { html, fixed: false };
    }
  }

  /**
   * Apply remaining fixes not in the ordered list with improved logic
   */
  private applyRemainingFixes(
    html: string,
    ruleOrder: string[],
    fixedRules: string[],
    maxIterations: number
  ): { html: string; iterations: number } {
    let fixedHtml = html;
    let iterations = 0;

    // Створюємо список всіх правил, що не в основному порядку
    const remainingRules: string[] = [];
    for (const [ruleName, rule] of Object.entries(EMAIL_VALIDATION_RULES)) {
      if (!ruleOrder.includes(ruleName) && rule.autofix) {
        const ruleConfig = this.config.rules[ruleName];
        const isRuleEnabled = ruleConfig ? ruleConfig.enabled : rule.enabled;

        if (isRuleEnabled) {
          remainingRules.push(ruleName);
        }
      }
    }

    // Застосовуємо решту правил з можливістю повторних проходів
    let hasChanges = true;
    let pass = 0;

    while (hasChanges && pass < 3 && iterations < maxIterations) {
      // До 3 проходів
      hasChanges = false;
      pass++;

      for (const ruleName of remainingRules) {
        if (iterations >= maxIterations) break;

        try {
          const beforeFix = fixedHtml;
          const { html: resultHtml, fixed } = this.applySingleFix(fixedHtml, ruleName);

          if (fixed && beforeFix !== resultHtml) {
            fixedHtml = resultHtml;
            if (!fixedRules.includes(ruleName)) {
              fixedRules.push(ruleName);
            }
            iterations++;
            hasChanges = true;
            logger.debug(
              "AutofixEngine",
              `Applied remaining auto-fix for rule: ${ruleName} (pass ${pass})`,
              { pass, rule: ruleName }
            );
          }
        } catch (error) {
          logger.error("AutofixEngine", `Error applying remaining auto-fix for rule ${ruleName}`, error);
        }
      }

      if (hasChanges) {
        logger.debug("AutofixEngine", `Remaining fixes pass ${pass} completed with changes`, {
          pass,
          iterations,
        });
      }
    }

    return { html: fixedHtml, iterations };
  }

  /**
   * Apply custom rule fixes with iteration limit
   */
  private applyCustomFixes(
    html: string,
    fixedRules: string[],
    maxIterations: number
  ): { html: string; iterations: number } {
    let fixedHtml = html;
    let iterations = 0;

    for (const [ruleName, rule] of this.customRules.entries()) {
      if (iterations >= maxIterations) break;

      const ruleConfig = this.config.rules[ruleName];

      // Custom rules are enabled by default unless explicitly disabled
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : true;

      if (!isRuleEnabled || !rule.autofix) {
        continue;
      }

      try {
        const { html: resultHtml, fixed } = this.applySingleFix(fixedHtml, ruleName);

        if (fixed) {
          fixedHtml = resultHtml;
          fixedRules.push(ruleName);
          iterations++;
          logger.debug("AutofixEngine", `Applied custom auto-fix for rule: ${ruleName}`);
        }
      } catch (error) {
        logger.error("AutofixEngine", `Error applying custom auto-fix for rule ${ruleName}`, error);
      }
    }

    return { html: fixedHtml, iterations };
  }

  /**
   * Validate HTML structure after fixes
   */
  private isValidHTMLStructure(html: string): boolean {
    if (!html || typeof html !== "string") return false;

    try {
      // Basic structure validation
      const openTags = (html.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (html.match(/<\/[^>]*>/g) || []).length;
      const selfClosingTags = (html.match(/<[^>]*\/>/g) || []).length;

      // Rough balance check (not perfect but catches major issues)
      const totalTags = openTags + closeTags + selfClosingTags;
      if (totalTags === 0) return true; // No tags is valid

      // Check for obvious structural issues
      if (html.includes("<<") || html.includes(">>")) return false;
      if (html.includes("<//") || html.includes("//>")) return false;

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Record fix history for monitoring and optimization
   */
  private recordFixHistory(
    originalHtml: string,
    fixedRules: string[],
    iterations: number,
    success: boolean
  ): void {
    const key = `${originalHtml.length}_${fixedRules.join("_")}`;

    this.fixHistory.set(key, {
      timestamp: Date.now(),
      iterations,
      success,
    });

    // Clean up if history is too large
    if (this.fixHistory.size > this.maxFixHistorySize) {
      const entries = Array.from(this.fixHistory.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );
      const toRemove = Math.floor(
        this.fixHistory.size * PERFORMANCE_CONSTANTS.CACHE_CLEANUP_PERCENTAGE_REDUCED
      );

      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.fixHistory.delete(entries[i][0]);
      }
    }
  }

  /**
   * Fix a specific issue by rule name with enhanced error handling and multiple passes
   */
  autoFixSpecificIssue(html: string, ruleName: string): { html: string; fixed: boolean } {
    if (!html || typeof html !== "string" || !ruleName) {
      return { html, fixed: false };
    }

    try {
      // Find the rule
      const rule = EMAIL_VALIDATION_RULES[ruleName] || this.customRules.get(ruleName);

      if (!rule) {
        logger.warn("AutofixEngine", `Rule ${ruleName} not found`);
        return { html, fixed: false };
      }

      if (!rule.autofix) {
        logger.warn("AutofixEngine", `Rule ${ruleName} has no autofix function`);
        return { html, fixed: false };
      }

      // Check if rule is enabled
      const ruleConfig = this.config.rules[ruleName];
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : rule.enabled;
      if (!isRuleEnabled) {
        logger.warn("AutofixEngine", `Rule ${ruleName} is disabled`);
        return { html, fixed: false };
      }

      let fixedHtml = html;
      let totalFixed = false;
      let iterations = 0;
      const maxIterations = 10; // Більше ітерацій для поодинокого правила

      // Застосовуємо правило кілька разів доки є зміни
      while (iterations < maxIterations) {
        const beforeFix = fixedHtml;

        try {
          const afterFix = rule.autofix(fixedHtml);

          // Перевіряємо чи є зміни
          if (beforeFix !== afterFix && this.isValidHTMLStructure(afterFix)) {
            fixedHtml = afterFix;
            totalFixed = true;
            iterations++;

            logger.debug(
              "AutofixEngine",
              `Applied fix for rule ${ruleName}, iteration ${iterations}`,
              { iteration: iterations, changed: true }
            );
          } else {
            // Немає більше змін
            break;
          }
        } catch (error) {
          logger.error("AutofixEngine", `Error in iteration ${iterations + 1} for rule ${ruleName}`, error);
          break;
        }

        // Безпека: якщо HTML став занадто великим
        if (
          fixedHtml.length >
          html.length * PERFORMANCE_CONSTANTS.MAX_HTML_SIZE_INCREASE_MULTIPLIER
        ) {
          logger.warn("AutofixEngine", `HTML size increased too much for rule ${ruleName}, stopping`, {
            originalSize: html.length,
            newSize: fixedHtml.length,
          });
          break;
        }
      }

      if (totalFixed) {
        logger.debug(
          "AutofixEngine",
          `Successfully fixed issue with rule ${ruleName} in ${iterations} iterations`,
          { iterations, sizeBefore: html.length, sizeAfter: fixedHtml.length }
        );
        return { html: fixedHtml, fixed: true };
      } else {
        logger.debug("AutofixEngine", `No changes made for rule ${ruleName}`);
        return { html, fixed: false };
      }
    } catch (error) {
      logger.error("AutofixEngine", `Error applying auto-fix for rule ${ruleName}`, error);
      return { html, fixed: false };
    }
  }

  /**
   * Fix multiple specific issues by rule names with enhanced logic
   */
  autoFixMultipleIssues(html: string, ruleNames: string[]): { html: string; fixed: string[] } {
    if (!html || typeof html !== "string" || !Array.isArray(ruleNames)) {
      return { html, fixed: [] };
    }

    let fixedHtml = html;
    const fixedRules: string[] = [];
    const maxPasses = 3; // Кілька проходів для кращого результату

    try {
      // Кілька проходів через всі правила
      for (let pass = 0; pass < maxPasses; pass++) {
        let passChanges = false;
        const beforePassHtml = fixedHtml;

        for (const ruleName of ruleNames) {
          const { html: resultHtml, fixed } = this.autoFixSpecificIssue(fixedHtml, ruleName);

          if (fixed) {
            fixedHtml = resultHtml;
            if (!fixedRules.includes(ruleName)) {
              fixedRules.push(ruleName);
            }
            passChanges = true;
          }
        }

        logger.debug(
          "AutofixEngine",
          `Multiple fixes pass ${pass + 1}: ${passChanges ? "changes made" : "no changes"}`,
          { pass: pass + 1, hasChanges: passChanges }
        );

        // Якщо немає змін, зупиняємось
        if (!passChanges || fixedHtml === beforePassHtml) {
          break;
        }
      }

      logger.debug(
        "AutofixEngine",
        `Multiple auto-fixes completed. Fixed ${fixedRules.length} rule types: ${fixedRules.join(", ")}`,
        { fixedCount: fixedRules.length, rules: fixedRules }
      );

      return {
        html: fixedHtml,
        fixed: fixedRules,
      };
    } catch (error) {
      logger.error("AutofixEngine", "Error applying multiple auto-fixes", error);
      return { html, fixed: [] };
    }
  }

  /**
   * Fix all issues of a specific severity level with iteration limit
   */
  autoFixAllIssues(html: string, severity: ValidationSeverity): { html: string; fixed: string[] } {
    if (!html || typeof html !== "string") {
      return { html, fixed: [] };
    }

    try {
      // Get all rules that have issues of the specified severity
      const targetRules = this.getRulesBySeverity(severity);

      if (targetRules.length === 0) {
        return { html, fixed: [] };
      }

      // Apply fixes for all applicable rules with iteration limit
      return this.autoFixMultipleIssues(html, targetRules);
    } catch (error) {
      logger.error("AutofixEngine", `Error fixing all ${severity} issues`, error);
      return { html, fixed: [] };
    }
  }

  /**
   * Fix all issues of a specific category with iteration limit
   */
  autoFixCategory(html: string, category: string): { html: string; fixed: string[] } {
    if (!html || typeof html !== "string" || !category) {
      return { html, fixed: [] };
    }

    try {
      // Get all rules of the specified category
      const targetRules = this.getRulesByCategory(category);

      if (targetRules.length === 0) {
        return { html, fixed: [] };
      }

      // Apply fixes for all applicable rules with iteration limit
      return this.autoFixMultipleIssues(html, targetRules);
    } catch (error) {
      logger.error("AutofixEngine", `Error fixing all ${category} issues`, error);
      return { html, fixed: [] };
    }
  }

  /**
   * Get available auto-fix rules
   */
  getAutoFixableRules(): string[] {
    const autoFixableRules: string[] = [];

    // Built-in rules
    Object.entries(EMAIL_VALIDATION_RULES).forEach(([ruleName, rule]) => {
      const ruleConfig = this.config.rules[ruleName];
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : rule.enabled;
      if (rule.autofix && isRuleEnabled) {
        autoFixableRules.push(ruleName);
      }
    });

    // Custom rules
    this.customRules.forEach((rule, ruleName) => {
      const ruleConfig = this.config.rules[ruleName];
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : true;
      if (rule.autofix && isRuleEnabled) {
        autoFixableRules.push(ruleName);
      }
    });

    return autoFixableRules;
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): string[] {
    const rules: string[] = [];

    // Built-in rules
    Object.entries(EMAIL_VALIDATION_RULES).forEach(([ruleName, rule]) => {
      const ruleConfig = this.config.rules[ruleName];
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : rule.enabled;
      if (rule.category === category && isRuleEnabled) {
        rules.push(ruleName);
      }
    });

    // Custom rules
    this.customRules.forEach((rule, ruleName) => {
      const ruleConfig = this.config.rules[ruleName];
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : true;
      if (rule.category === category && isRuleEnabled) {
        rules.push(ruleName);
      }
    });

    return rules;
  }

  /**
   * Get rules by severity
   */
  getRulesBySeverity(severity: ValidationSeverity): string[] {
    const rules: string[] = [];

    // Built-in rules
    Object.entries(EMAIL_VALIDATION_RULES).forEach(([ruleName, rule]) => {
      const ruleConfig = this.config.rules[ruleName];
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : rule.enabled;
      if (rule.severity === severity && isRuleEnabled) {
        rules.push(ruleName);
      }
    });

    // Custom rules
    this.customRules.forEach((rule, ruleName) => {
      const ruleConfig = this.config.rules[ruleName];
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : true;
      if (rule.severity === severity && isRuleEnabled) {
        rules.push(ruleName);
      }
    });

    return rules;
  }

  /**
   * Add custom validation rule
   */
  addRule(rule: ValidationRule): void {
    if (!rule || !rule.name) {
      logger.warn("AutofixEngine", "Invalid validation rule provided", rule);
      return;
    }

    this.customRules.set(rule.name, rule);
  }

  /**
   * Remove custom validation rule
   */
  removeRule(ruleName: string): void {
    if (!ruleName) {
      logger.warn("AutofixEngine", "Invalid rule name provided for removal", ruleName);
      return;
    }

    this.customRules.delete(ruleName);
  }

  /**
   * Get current configuration
   */
  getConfig(): EmailValidatorConfig {
    return { ...this.config };
  }

  /**
   * Update validator configuration
   */
  updateConfig(newConfig: Partial<EmailValidatorConfig>): void {
    if (!newConfig) {
      logger.warn("AutofixEngine", "Invalid config provided for update", newConfig);
      return;
    }

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
  }

  /**
   * Enable/disable specific rule
   */
  setRuleEnabled(ruleName: string, enabled: boolean): void {
    if (!ruleName) {
      logger.warn("AutofixEngine", "Invalid rule name provided for enable/disable", ruleName);
      return;
    }

    if (!this.config.rules[ruleName]) {
      this.config.rules[ruleName] = { enabled };
    } else {
      this.config.rules[ruleName].enabled = enabled;
    }
  }

  /**
   * Change rule severity
   */
  setRuleSeverity(ruleName: string, severity: ValidationSeverity): void {
    if (!ruleName || !severity) {
      logger.warn("AutofixEngine", "Invalid rule name or severity provided", { ruleName, severity });
      return;
    }

    if (!this.config.rules[ruleName]) {
      this.config.rules[ruleName] = { enabled: true, severity };
    } else {
      this.config.rules[ruleName].severity = severity;
    }
  }

  /**
   * Get fix history statistics
   */
  getFixHistoryStats(): {
    totalFixes: number;
    successfulFixes: number;
    averageIterations: number;
    recentSuccessRate: number;
  } {
    const entries = Array.from(this.fixHistory.values());
    const totalFixes = entries.length;
    const successfulFixes = entries.filter((e) => e.success).length;
    const averageIterations = entries.reduce((sum, e) => sum + e.iterations, 0) / totalFixes || 0;

    // Calculate recent success rate (last 10 fixes)
    const recentEntries = entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, PERFORMANCE_CONSTANTS.MAX_RECENT_FIXES_TRACKED);
    const recentSuccessRate =
      recentEntries.length > 0
        ? recentEntries.filter((e) => e.success).length / recentEntries.length
        : 0;

    return {
      totalFixes,
      successfulFixes,
      averageIterations: Math.round(averageIterations * 100) / 100,
      recentSuccessRate: Math.round(recentSuccessRate * 100) / 100,
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Clear all caches
    this.customRules.clear();
    this.fixHistory.clear();

    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    logger.debug("AutofixEngine", "Disposed and all caches cleared");
  }
}
