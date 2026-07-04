import { logger } from "../utils/logger";
import { parseEmailHtml, serializeEmailHtml } from "./domUtils";
import { ERROR_MESSAGES, PERFORMANCE_CONSTANTS } from "./EMAIL_CONSTANTS";
import { EmailValidatorConfig, RuleContext, ValidationRule, ValidationSeverity } from "./types";
import { ValidationEngine } from "./ValidationEngine";
import { EMAIL_VALIDATION_RULES } from "./validationRules";

/**
 * Applies autofixes on a shared parsed Document.
 *
 * Pipeline per run:
 *   1. string-level preprocess hooks (defects the parser would misread)
 *   2. parse once with DOMParser
 *   3. rule autofixes mutate the document (multiple passes until stable)
 *   4. serialize once — only when something actually changed
 *
 * Because fixes are DOM mutations, the output is well-formed by construction;
 * there is no post-hoc "structure validation" that silently reverts fixes.
 */
export class AutofixEngine {
  private config: EmailValidatorConfig;
  private customRules: Map<string, ValidationRule> = new Map();
  private fixHistory: Map<string, { timestamp: number; iterations: number; success: boolean }> =
    new Map();
  private maxFixHistorySize = PERFORMANCE_CONSTANTS.MAX_FIX_HISTORY_SIZE;

  // Preprocess-first order: string-level repairs must run before parsing.
  private static readonly RULE_ORDER = [
    "malformed-attributes",
    "duplicate-styles",
    "email-safe-tags",
    // Structure cleanup
    "dangerous-tags",
    "heading-tags",
    "paragraph-tags",
    "block-element-tags",
    // Attributes and links
    "email-safe-links",
    "image-alt-attributes",
    "table-attributes",
    "email-unsafe-attributes",
    // Final cleanup
    "table-nesting-cleanup",
    "empty-elements-cleanup",
  ];

  constructor(config: EmailValidatorConfig) {
    this.config = config;
  }

  private getRule(ruleName: string): ValidationRule | undefined {
    return EMAIL_VALIDATION_RULES[ruleName] ?? this.customRules.get(ruleName);
  }

  private isRuleEnabled(ruleName: string, rule: ValidationRule): boolean {
    const ruleConfig = this.config.rules[ruleName];
    if (ruleConfig) return ruleConfig.enabled;
    return this.customRules.has(ruleName) ? true : rule.enabled;
  }

  /**
   * Core pipeline: apply the given rules (in order) to the HTML.
   */
  private runPipeline(html: string, ruleNames: string[]): { html: string; fixed: string[] } {
    const rules = ruleNames
      .map((name) => ({ name, rule: this.getRule(name) }))
      .filter((entry): entry is { name: string; rule: ValidationRule } =>
        Boolean(entry.rule && this.isRuleEnabled(entry.name, entry.rule!))
      );

    if (rules.length === 0) {
      return { html, fixed: [] };
    }

    const fixed = new Set<string>();

    // 1. String-level preprocess
    let source = html;
    for (const { name, rule } of rules) {
      if (!rule.preprocess) continue;
      try {
        const after = rule.preprocess(source);
        if (after !== source) {
          source = after;
          fixed.add(name);
        }
      } catch (error) {
        logger.error("AutofixEngine", `Error in preprocess for rule ${name}`, error);
      }
    }

    // 2. Parse once
    const parsed = parseEmailHtml(source);

    // 3. DOM fixes, repeated until a pass makes no changes
    for (let pass = 0; pass < PERFORMANCE_CONSTANTS.MAX_AUTOFIX_PASSES; pass++) {
      let passChanged = false;

      for (const { name, rule } of rules) {
        if (!rule.autofix) continue;
        try {
          const ctx: RuleContext = {
            html: source,
            doc: parsed.doc,
            config: this.config.rules[name]?.config ?? rule.config,
            validatorConfig: this.config,
          };
          if (rule.autofix(ctx)) {
            fixed.add(name);
            passChanged = true;
          }
        } catch (error) {
          logger.error("AutofixEngine", `Error applying auto-fix for rule ${name}`, error);
        }
      }

      if (!passChanged) break;
    }

    // 4. Serialize only when something changed; otherwise return the input
    //    untouched so a no-op fix never reformats the user's HTML.
    if (fixed.size === 0) {
      return { html, fixed: [] };
    }
    return { html: serializeEmailHtml(parsed), fixed: Array.from(fixed) };
  }

  /**
   * All enabled fixable rules in the canonical order (unknown/custom rules last).
   */
  private allFixableRuleNames(): string[] {
    const names: string[] = [...AutofixEngine.RULE_ORDER];

    for (const ruleName of Object.keys(EMAIL_VALIDATION_RULES)) {
      if (!names.includes(ruleName)) names.push(ruleName);
    }
    for (const ruleName of this.customRules.keys()) {
      if (!names.includes(ruleName)) names.push(ruleName);
    }

    return names.filter((name) => {
      const rule = this.getRule(name);
      return Boolean(rule && (rule.autofix || rule.preprocess));
    });
  }

  /**
   * Attempt to automatically fix HTML with all enabled rules
   */
  autoFix(html: string): { html: string; fixed: string[] } {
    if (!html || typeof html !== "string") {
      return { html: "", fixed: [] };
    }

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

    try {
      const result = this.runPipeline(html, this.allFixableRuleNames());
      this.recordFixHistory(html, result.fixed, result.fixed.length, true);
      return result;
    } catch (error) {
      logger.error("AutofixEngine", "Critical auto-fix error", error);
      this.recordFixHistory(html, [], 0, false);
      return { html, fixed: [] };
    }
  }

  /**
   * Fix a specific issue by rule name
   */
  autoFixSpecificIssue(html: string, ruleName: string): { html: string; fixed: boolean } {
    if (!html || typeof html !== "string" || !ruleName) {
      return { html, fixed: false };
    }

    const rule = this.getRule(ruleName);
    if (!rule) {
      logger.warn("AutofixEngine", `Rule ${ruleName} not found`);
      return { html, fixed: false };
    }
    if (!rule.autofix && !rule.preprocess) {
      logger.warn("AutofixEngine", `Rule ${ruleName} has no autofix function`);
      return { html, fixed: false };
    }
    if (!this.isRuleEnabled(ruleName, rule)) {
      logger.warn("AutofixEngine", `Rule ${ruleName} is disabled`);
      return { html, fixed: false };
    }

    try {
      const result = this.runPipeline(html, [ruleName]);
      return { html: result.html, fixed: result.fixed.length > 0 };
    } catch (error) {
      logger.error("AutofixEngine", `Error applying auto-fix for rule ${ruleName}`, error);
      return { html, fixed: false };
    }
  }

  /**
   * Fix multiple specific issues by rule names
   */
  autoFixMultipleIssues(html: string, ruleNames: string[]): { html: string; fixed: string[] } {
    if (!html || typeof html !== "string" || !Array.isArray(ruleNames)) {
      return { html, fixed: [] };
    }

    try {
      // Apply in the canonical order so e.g. preprocess-based rules run first.
      const ordered = this.allFixableRuleNames().filter((name) => ruleNames.includes(name));
      return this.runPipeline(html, ordered);
    } catch (error) {
      logger.error("AutofixEngine", "Error applying multiple auto-fixes", error);
      return { html, fixed: [] };
    }
  }

  /**
   * Fix all issues of a specific severity level.
   *
   * Rules are selected by the severity of the *reported issues*, not by the
   * rule's declared severity — a rule declared "error" can emit warnings, and
   * those must be fixable from the Warnings group.
   */
  autoFixAllIssues(html: string, severity: ValidationSeverity): { html: string; fixed: string[] } {
    if (!html || typeof html !== "string") {
      return { html, fixed: [] };
    }

    try {
      const targetRules = this.collectRuleNamesFromIssues(
        html,
        (issue) => issue.severity === severity
      );
      if (targetRules.length === 0) {
        return { html, fixed: [] };
      }
      return this.autoFixMultipleIssues(html, targetRules);
    } catch (error) {
      logger.error("AutofixEngine", `Error fixing all ${severity} issues`, error);
      return { html, fixed: [] };
    }
  }

  /**
   * Fix all issues of a specific category (selected by reported issues,
   * see autoFixAllIssues).
   */
  autoFixCategory(html: string, category: string): { html: string; fixed: string[] } {
    if (!html || typeof html !== "string" || !category) {
      return { html, fixed: [] };
    }

    try {
      const targetRules = this.collectRuleNamesFromIssues(
        html,
        (issue) => issue.category === category
      );
      if (targetRules.length === 0) {
        return { html, fixed: [] };
      }
      return this.autoFixMultipleIssues(html, targetRules);
    } catch (error) {
      logger.error("AutofixEngine", `Error fixing all ${category} issues`, error);
      return { html, fixed: [] };
    }
  }

  /**
   * Validate the HTML and return the rule names behind fixable issues that
   * match the predicate.
   */
  private collectRuleNamesFromIssues(
    html: string,
    matches: (issue: { severity: ValidationSeverity; category?: string; rule: string }) => boolean
  ): string[] {
    const engine = new ValidationEngine(this.config);
    this.customRules.forEach((rule) => engine.addRule(rule));
    const report = engine.validate(html);
    engine.dispose();

    const allIssues = [...report.errors, ...report.warnings, ...report.suggestions];
    const ruleNames = new Set<string>();
    for (const issue of allIssues) {
      if (issue.autoFixAvailable && matches(issue)) {
        ruleNames.add(issue.rule);
      }
    }
    return Array.from(ruleNames);
  }

  /**
   * Record fix history for monitoring
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
   * Get available auto-fix rules
   */
  getAutoFixableRules(): string[] {
    return this.allFixableRuleNames().filter((name) => {
      const rule = this.getRule(name)!;
      return this.isRuleEnabled(name, rule);
    });
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: string): string[] {
    const rules: string[] = [];

    Object.entries(EMAIL_VALIDATION_RULES).forEach(([ruleName, rule]) => {
      if (rule.category === category && this.isRuleEnabled(ruleName, rule)) {
        rules.push(ruleName);
      }
    });

    this.customRules.forEach((rule, ruleName) => {
      if (rule.category === category && this.isRuleEnabled(ruleName, rule)) {
        rules.push(ruleName);
      }
    });

    return rules;
  }

  /**
   * Get rules by declared severity
   */
  getRulesBySeverity(severity: ValidationSeverity): string[] {
    const rules: string[] = [];

    Object.entries(EMAIL_VALIDATION_RULES).forEach(([ruleName, rule]) => {
      if (rule.severity === severity && this.isRuleEnabled(ruleName, rule)) {
        rules.push(ruleName);
      }
    });

    this.customRules.forEach((rule, ruleName) => {
      if (rule.severity === severity && this.isRuleEnabled(ruleName, rule)) {
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
    this.customRules.clear();
    this.fixHistory.clear();
  }
}
