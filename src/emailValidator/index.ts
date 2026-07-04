// Email HTML Validator - Main exports

export { AutofixEngine } from "./AutofixEngine";
export { ASTCache, RegexCache, StringBatcher } from "./cache";
export { EMAIL_DEFAULTS } from "./EMAIL_CONSTANTS";
export { defaultEmailValidator,EmailHTMLValidator } from "./EmailHTMLValidator";
export { EmailValidationPanel } from "./EmailValidationPanel";
export {
  findNodesByAttribute,
  findNodesByTagName,
  SimpleHTMLParser,
  traverseAST,
} from "./htmlParser";
export {
  createValidationPattern,
  getTagPatterns,
  REGEX_FLAGS,
  REGEX_PATTERNS,
} from "./regexPatterns";
export type {
  EmailValidationReport,
  EmailValidatorConfig,
  HTMLNode,
  RuleContext,
  ValidationResult,
  ValidationRule,
  ValidationSeverity,
} from "./types";
export {
  EMAIL_OPEN_TAGS,
  EMAIL_SAFE_TAGS,
  EMAIL_SELF_CLOSING_TAGS,
  FORBIDDEN_TAGS,
  OUTLOOK_INCOMPATIBLE_CSS,
  REQUIRED_TABLE_ATTRIBUTES,
} from "./types";
export { ValidationEngine } from "./ValidationEngine";
export { EMAIL_VALIDATION_RULES } from "./validationRules";
export {
  AutofixUtils,
  getFontSizeForHeading,
  HEADING_FONT_SIZES,
  ValidationChecks,
} from "./validationUtils";
