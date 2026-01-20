// Email HTML Validator - Main exports

export { EmailHTMLValidator, defaultEmailValidator } from "./EmailHTMLValidator";
export { EmailValidationPanel } from "./EmailValidationPanel";
export { ValidationEngine } from "./ValidationEngine";
export { AutofixEngine } from "./AutofixEngine";
export { EMAIL_VALIDATION_RULES } from "./validationRules";
export { EMAIL_DEFAULTS } from "./EMAIL_CONSTANTS";
export { RegexCache, ASTCache, StringBatcher } from "./cache";
export {
  SimpleHTMLParser,
  traverseAST,
  findNodesByTagName,
  findNodesByAttribute,
} from "./htmlParser";
export {
  REGEX_PATTERNS,
  REGEX_FLAGS,
  getTagPatterns,
  createValidationPattern,
} from "./regexPatterns";
export {
  ValidationChecks,
  AutofixUtils,
  HEADING_FONT_SIZES,
  getFontSizeForHeading,
} from "./validationUtils";

export type {
  ValidationResult,
  EmailValidationReport,
  EmailValidatorConfig,
  ValidationRule,
  ValidationSeverity,
  HTMLNode,
  TraversalContext,
} from "./types";

export {
  EMAIL_SAFE_TAGS,
  FORBIDDEN_TAGS,
  EMAIL_OPEN_TAGS,
  EMAIL_SELF_CLOSING_TAGS,
  OUTLOOK_INCOMPATIBLE_CSS,
  REQUIRED_TABLE_ATTRIBUTES,
} from "./types";
