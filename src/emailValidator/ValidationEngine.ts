import { logger } from "../utils/logger";
import { parseEmailHtml } from "./domUtils";
import { ERROR_MESSAGES, SCORING_CONSTANTS } from "./EMAIL_CONSTANTS";
import {
  EmailValidationReport,
  EmailValidatorConfig,
  RuleContext,
  ValidationResult,
  ValidationRule,
} from "./types";
import { EMAIL_VALIDATION_RULES } from "./validationRules";

/**
 * Runs validation rules against HTML. The HTML is parsed with DOMParser
 * exactly once per validate() call and every rule inspects the same Document,
 * so repeated validations of the same input always produce the same report.
 */
export class ValidationEngine {
  private config: EmailValidatorConfig;
  private customRules: Map<string, ValidationRule> = new Map();

  constructor(config: EmailValidatorConfig) {
    this.config = config;
  }

  /**
   * Validate HTML against email-safe rules
   */
  validate(html: string): EmailValidationReport {
    if (!html || typeof html !== "string") {
      return this.createEmptyReport("Invalid HTML input provided");
    }

    if (html.length > this.config.maxHtmlSize) {
      const maxSizeKB = Math.round(this.config.maxHtmlSize / 1024);
      return this.createEmptyReport(
        `${ERROR_MESSAGES.HTML_TOO_LARGE} (over ${maxSizeKB}KB)`,
        "html-too-large",
        "performance"
      );
    }

    try {
      const { doc } = parseEmailHtml(html);
      const allResults: ValidationResult[] = [
        ...this.runRules(EMAIL_VALIDATION_RULES, html, doc, false),
        ...this.runRules(Object.fromEntries(this.customRules), html, doc, true),
      ];

      const errors = allResults.filter((r) => r.severity === "error");
      const warnings = allResults.filter((r) => r.severity === "warning");
      const suggestions = allResults.filter((r) => r.severity === "info");

      // Strict mode treats warnings as blocking (matches the Settings toggle).
      const isValid = errors.length === 0 && (!this.config.strictMode || warnings.length === 0);

      return {
        isValid,
        errors,
        warnings,
        suggestions,
        autoFixAvailable: allResults.some((r) => r.autoFixAvailable),
        totalIssues: allResults.length,
        categories: this.calculateCategories(allResults),
        score: this.calculateValidationScore(allResults),
      };
    } catch (error) {
      logger.error("ValidationEngine", "Critical validation error", error);
      return this.createEmptyReport(
        `Validation system error: ${error instanceof Error ? error.message : "Unknown error"}`,
        "validation-system-error",
        "structure"
      );
    }
  }

  /**
   * Run a set of rules against the shared document
   */
  private runRules(
    rules: Record<string, ValidationRule>,
    html: string,
    doc: Document,
    isCustom: boolean
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const [ruleName, rule] of Object.entries(rules)) {
      const ruleConfig = this.config.rules[ruleName];
      const isRuleEnabled = ruleConfig ? ruleConfig.enabled : isCustom ? true : rule.enabled;
      if (!isRuleEnabled) continue;

      if (rule.category === "accessibility" && !this.config.checkAccessibility) continue;
      if (rule.category === "performance" && !this.config.checkPerformance) continue;
      if (rule.category === "best-practice" && !this.config.checkBestPractices) continue;

      try {
        const ctx: RuleContext = {
          html,
          doc,
          config: ruleConfig?.config ?? rule.config,
          validatorConfig: this.config,
        };
        const ruleResults = rule.check(ctx);

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
   * Calculate validation score (0-100). Repeated issues from the same rule
   * cost a fraction of the first one, so one systemic problem repeated many
   * times doesn't flatten the score to 0.
   */
  private calculateValidationScore(results: ValidationResult[]): number {
    if (results.length === 0) {
      return SCORING_CONSTANTS.MAX_SCORE;
    }

    const seenRules = new Map<string, number>();
    let totalPenalty = 0;

    for (const result of results) {
      const basePenalty =
        result.severity === "error"
          ? SCORING_CONSTANTS.ERROR_PENALTY
          : result.severity === "warning"
            ? SCORING_CONSTANTS.WARNING_PENALTY
            : SCORING_CONSTANTS.INFO_PENALTY;

      const priorCount = seenRules.get(result.rule) ?? 0;
      seenRules.set(result.rule, priorCount + 1);

      totalPenalty +=
        priorCount === 0 ? basePenalty : basePenalty * SCORING_CONSTANTS.REPEAT_ISSUE_FACTOR;
    }

    const score = Math.max(
      0,
      SCORING_CONSTANTS.MAX_SCORE - Math.min(totalPenalty, SCORING_CONSTANTS.MAX_PENALTY)
    );
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
    const { doc } = parseEmailHtml(html);
    return rule.check({
      html,
      doc,
      config: ruleConfig?.config ?? rule.config,
      validatorConfig: this.config,
    });
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
    // Modern CSS warnings are suppressed when the user explicitly allows
    // modern CSS in the validator config.
    if (this.config.allowModernCSS) return;

    if (html.includes("flexbox") || html.includes("display: flex") || html.includes("display:flex")) {
      issues.push("Flexbox not supported in Outlook");
    }

    if (html.includes("display: grid") || html.includes("display:grid")) {
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
    if (html.includes("<style>")) {
      issues.push("Gmail may strip <style> tags on mobile");
    }

    if (html.includes("background-image")) {
      issues.push("Background images may not display consistently in Gmail");
    }
  }

  private validateMobileCompatibility(html: string, issues: string[]): void {
    if (html.includes('width="') && !html.includes("max-width")) {
      issues.push("Fixed widths without max-width may cause horizontal scrolling on mobile");
    }

    if (html.includes("font-size:") && html.includes("px")) {
      issues.push("Consider using relative font sizes for better mobile experience");
    }
  }

  /**
   * Cache statistics — kept for API compatibility; the DOM-based engine
   * holds no caches.
   */
  getCacheStats(): { customRules: number } {
    return { customRules: this.customRules.size };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.customRules.clear();
  }
}
