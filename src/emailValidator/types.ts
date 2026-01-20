// Email validation types and interfaces

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationResult {
  rule: string;
  severity: ValidationSeverity;
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
  autoFixAvailable?: boolean;
  category?: "structure" | "accessibility" | "compatibility" | "performance" | "best-practice";
}

export interface EmailValidationReport {
  isValid: boolean;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  suggestions: ValidationResult[];
  autoFixAvailable: boolean;
  totalIssues: number;
  categories: {
    structure: number;
    accessibility: number;
    compatibility: number;
    performance: number;
    "best-practice": number;
  };
  score: number; // 0-100 validation score
}

export interface ValidationRule {
  name: string;
  displayName: string;
  description: string;
  severity: ValidationSeverity;
  enabled: boolean;
  configurable: boolean;
  category: "structure" | "accessibility" | "compatibility" | "performance" | "best-practice";
  config?: Record<
    string,
    string | number | boolean | readonly string[] | Record<string, readonly string[]>
  >;
  check: (
    html: string,
    config?: Record<
      string,
      string | number | boolean | readonly string[] | Record<string, readonly string[]>
    >
  ) => ValidationResult[];
  checkWithAST?: (
    html: string,
    ast: HTMLNode[],
    config?: Record<
      string,
      string | number | boolean | readonly string[] | Record<string, readonly string[]>
    >,
    traversalContext?: TraversalContext
  ) => ValidationResult[];
  autofix?: (
    html: string,
    config?: Record<
      string,
      string | number | boolean | readonly string[] | Record<string, readonly string[]>
    >
  ) => string;
}

/**
 * Контекст для оптимізованого DOM traversal
 */
export interface TraversalContext {
  ast: HTMLNode[];
  getTraversalResult: (operation: string, key: string) => HTMLNode[];
  findNodesByTag: (tagName: string) => HTMLNode[];
  findNodesByAttribute: (attrName: string, attrValue?: string) => HTMLNode[];
  findNodesByCategory: (category: string) => HTMLNode[];
}

export interface EmailValidatorConfig {
  rules: Record<
    string,
    {
      enabled: boolean;
      severity?: ValidationSeverity;
      config?: Record<
        string,
        string | number | boolean | readonly string[] | Record<string, readonly string[]>
      >;
    }
  >;

  // Email client compatibility
  targetClients: {
    outlook: boolean;
    gmail: boolean;
    applemail: boolean;
    thunderbird: boolean;
    mobile: boolean;
  };

  // HTML restrictions
  strictMode: boolean;
  allowModernCSS: boolean;
  maxTableNesting: number;

  // New validation options
  checkAccessibility: boolean;
  checkPerformance: boolean;
  checkBestPractices: boolean;
  maxFileSize: number; // in KB
  maxHtmlSize: number; // in bytes for validation/autofix limits
  requireAltText: boolean;
  requireFallbacks: boolean;
}

export interface HTMLNode {
  type: "element" | "text" | "comment";
  tagName?: string;
  attributes?: Record<string, string>;
  children?: HTMLNode[];
  content?: string;
  line?: number;
  column?: number;
}

// Email-safe HTML constraints
export const EMAIL_SAFE_TAGS = [
  "table",
  "tbody",
  "thead",
  "tfoot",
  "tr",
  "td",
  "th",
  "img",
  "a",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "br",
  "center",
  "font",
  "big",
  "small",
  "sup",
  "sub",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
] as const;

export const FORBIDDEN_TAGS = [
  "div",
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "section",
  "article",
  "aside",
  "nav",
  "header",
  "footer",
  "main",
  "figure",
  "figcaption",
  "canvas",
  "svg",
  "video",
  "audio",
  "iframe",
  "embed",
  "object",
  "script",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "option",
  "fieldset",
  "legend",
  "label",
] as const;

// Email-specific tag formatting rules
export const EMAIL_OPEN_TAGS = ["br", "hr"] as const; // These should be <br> not <br/>
export const EMAIL_SELF_CLOSING_TAGS = ["img", "area", "base", "col", "input"] as const; // These should be <img/>

export const REQUIRED_TABLE_ATTRIBUTES = {
  table: ['cellpadding="0"', 'cellspacing="0"', 'border="0"'],
  img: ["alt", 'style="display:block"'],
  a: ['target="_blank"'],
  td: ['valign="top"'],
} as const;

export const OUTLOOK_INCOMPATIBLE_CSS = [
  "flexbox",
  "grid",
  "position: fixed",
  "position: absolute",
  "transform",
  "animation",
  "transition",
  "box-shadow",
  "opacity",
  "rgba",
  "hsla",
  "calc(",
  "vh",
  "vw",
  "vmin",
  "vmax",
  "linear-gradient",
  "radial-gradient",
  "conic-gradient",
] as const;

// New constants for enhanced validation
export const SAFE_FONTS = [
  "Arial",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Lucida Console",
  "Impact",
  "Comic Sans MS",
] as const;

export const REQUIRED_IMAGE_ATTRIBUTES = [
  "alt",
  "width",
  "height",
  'style="display:block"',
] as const;

export const REQUIRED_LINK_ATTRIBUTES = ["href", 'target="_blank"'] as const;

export const PERFORMANCE_ISSUES = [
  "background-image",
  "external-css",
  "inline-scripts",
  "large-images",
  "excessive-nesting",
] as const;

export const ACCESSIBILITY_ISSUES = [
  "missing-alt",
  "missing-title",
  "poor-contrast",
  "no-fallbacks",
  "inaccessible-links",
] as const;
