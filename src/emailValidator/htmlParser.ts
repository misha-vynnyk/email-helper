import { PERFORMANCE_CONSTANTS } from "./EMAIL_CONSTANTS";
import { HTMLNode } from "./types";
import { logger } from "../utils/logger";

export class SimpleHTMLParser {
  private html: string;
  private position: number;
  private line: number;
  private column: number;

  constructor(html: string) {
    this.html = html;
    this.position = 0;
    this.line = 1;
    this.column = 1;
  }

  parse(): HTMLNode[] {
    const nodes: HTMLNode[] = [];
    const maxIterations = PERFORMANCE_CONSTANTS.MAX_PARSER_ITERATIONS;
    let iterations = 0;

    try {
      while (this.position < this.html.length && iterations < maxIterations) {
        iterations++;
        const node = this.parseNode();
        if (node) {
          nodes.push(node);
        }

        // Prevent infinite loops
        if (this.position >= this.html.length) {
          break;
        }

        // Additional safety check
        if (iterations >= maxIterations) {
          logger.warn(
            "SimpleHTMLParser",
            "Reached max iterations, stopping to prevent infinite loop",
            { iterations, maxIterations }
          );
          break;
        }
      }
    } catch (error) {
      logger.warn("SimpleHTMLParser", "Parser error", error);
      // Return what we have so far
    }

    return nodes;
  }

  private parseNode(): HTMLNode | null {
    this.skipWhitespace();

    if (this.position >= this.html.length) {
      return null;
    }

    if (this.html[this.position] === "<") {
      if (this.html.substr(this.position, 4) === "<!--") {
        return this.parseComment();
      }
      return this.parseElement();
    }

    return this.parseText();
  }

  private parseElement(): HTMLNode | null {
    const startLine = this.line;
    const startColumn = this.column;

    if (this.html[this.position] !== "<") {
      return null;
    }

    this.advance(); // Skip '<'

    // Check for closing tag
    const isClosing = this.html[this.position] === "/";
    if (isClosing) {
      this.advance(); // Skip '/'
      const closingTagName = this.parseTagName();
      if (closingTagName) {
        // Skip '>' for closing tag
        if (this.html[this.position] === ">") {
          this.advance();
        }
        return null; // Closing tags are handled by parseChildren
      }
      return null;
    }

    // Parse tag name
    const tagName = this.parseTagName();
    if (!tagName) {
      return null;
    }

    // Parse attributes
    const attributes = this.parseAttributes();

    // Check for self-closing
    const isSelfClosing = this.html[this.position] === "/";
    if (isSelfClosing) {
      this.advance(); // Skip '/'
    }

    // Skip '>'
    if (this.html[this.position] === ">") {
      this.advance();
    }

    const node: HTMLNode = {
      type: "element",
      tagName: tagName.toLowerCase(),
      attributes,
      line: startLine,
      column: startColumn,
      children: [],
    };

    // Parse children if not self-closing
    if (!isSelfClosing && !this.isSelfClosingTag(tagName)) {
      node.children = this.parseChildren(tagName);
    }

    return node;
  }

  private parseTagName(): string {
    let tagName = "";

    while (this.position < this.html.length && /[a-zA-Z0-9]/.test(this.html[this.position])) {
      tagName += this.html[this.position];
      this.advance();
    }

    return tagName;
  }

  /**
   * Parse attributes with safety counter
   */
  private parseAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {};

    let safetyCounter = 0;
    while (
      this.position < this.html.length &&
      this.html[this.position] !== ">" &&
      this.html[this.position] !== "/"
    ) {
      const beforePos = this.position;
      this.skipWhitespace();

      if (this.position >= this.html.length) {
        break;
      }

      if (this.html[this.position] === ">" || this.html[this.position] === "/") {
        break;
      }

      const attr = this.parseAttribute();
      if (attr) {
        attributes[attr.name] = attr.value;
      }

      // Safety: ensure forward progress to avoid infinite loops on malformed attributes
      if (this.position === beforePos) {
        this.advance();
      }

      safetyCounter++;
      if (safetyCounter > PERFORMANCE_CONSTANTS.MAX_PARSER_SAFETY_COUNTER) {
        // Bail out to prevent pathological cases
        break;
      }
    }

    return attributes;
  }

  private parseAttribute(): { name: string; value: string } | null {
    const name = this.parseAttributeName();
    if (!name) {
      return null;
    }

    this.skipWhitespace();

    if (this.position >= this.html.length) {
      return { name, value: "" };
    }

    if (this.html[this.position] !== "=") {
      return { name, value: "" };
    }

    this.advance(); // Skip '='
    this.skipWhitespace();

    const value = this.parseAttributeValue();

    return { name, value };
  }

  private parseAttributeName(): string {
    let name = "";

    while (this.position < this.html.length && /[a-zA-Z0-9\-_:]/.test(this.html[this.position])) {
      name += this.html[this.position];
      this.advance();
    }

    return name;
  }

  private parseAttributeValue(): string {
    if (this.position >= this.html.length) {
      return "";
    }

    const quote = this.html[this.position];

    if (quote === '"' || quote === "'") {
      this.advance(); // Skip opening quote

      let value = "";
      while (this.position < this.html.length && this.html[this.position] !== quote) {
        value += this.html[this.position];
        this.advance();
      }

      if (this.position < this.html.length && this.html[this.position] === quote) {
        this.advance(); // Skip closing quote
      }

      return value;
    }

    // Unquoted value
    let value = "";
    while (this.position < this.html.length && !/[\s>]/.test(this.html[this.position])) {
      value += this.html[this.position];
      this.advance();
    }

    return value;
  }

  /**
   * Parse children with depth limit
   */
  private parseChildren(parentTagName: string): HTMLNode[] {
    const children: HTMLNode[] = [];
    const maxDepth = PERFORMANCE_CONSTANTS.MAX_PARSER_DEPTH;
    let depth = 0;
    const startPosition = this.position;

    while (this.position < this.html.length && depth < maxDepth) {
      depth++;

      // Prevent infinite loops by checking if we're stuck
      if (this.position === startPosition && depth > 1) {
        this.advance(); // Force advance to prevent infinite loop
      }

      // Check for closing tag
      if (this.html.substr(this.position, 2 + parentTagName.length + 1) === `</${parentTagName}>`) {
        // Skip closing tag
        this.position += 2 + parentTagName.length + 1;
        this.updatePosition();
        break;
      }

      const child = this.parseNode();
      if (child) {
        children.push(child);
      } else {
        // If we can't parse a child, try to advance to prevent infinite loops
        if (this.position < this.html.length) {
          this.advance();
        }
        break;
      }

      // Additional safety check
      if (this.position >= this.html.length) {
        break;
      }
    }

    if (depth >= maxDepth) {
      // Silently handle max depth
    }

    return children;
  }

  private parseText(): HTMLNode {
    const startLine = this.line;
    const startColumn = this.column;
    let content = "";

    while (this.position < this.html.length && this.html[this.position] !== "<") {
      content += this.html[this.position];
      this.advance();
    }

    return {
      type: "text",
      content: content.trim(),
      line: startLine,
      column: startColumn,
    };
  }

  private parseComment(): HTMLNode {
    const startLine = this.line;
    const startColumn = this.column;

    this.position += 4; // Skip '<!--'
    let content = "";

    while (this.position < this.html.length && this.html.substr(this.position, 3) !== "-->") {
      content += this.html[this.position];
      this.advance();
    }

    if (this.position < this.html.length && this.html.substr(this.position, 3) === "-->") {
      this.position += 3;
      this.updatePosition();
    }

    return {
      type: "comment",
      content,
      line: startLine,
      column: startColumn,
    };
  }

  private isSelfClosingTag(tagName: string): boolean {
    const selfClosingTags = ["br", "img", "hr", "area", "base", "col", "input"];
    return selfClosingTags.includes(tagName.toLowerCase());
  }

  private skipWhitespace(): void {
    while (this.position < this.html.length && /\s/.test(this.html[this.position])) {
      this.advance();
    }
  }

  private advance(): void {
    if (this.position >= this.html.length) {
      return;
    }

    if (this.html[this.position] === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.position++;
  }

  /**
   * Update position with safety bounds
   */
  private updatePosition(): void {
    // More robust position updating
    for (let i = 0; i < 3 && this.position - 3 + i >= 0; i++) {
      const char = this.html[this.position - 3 + i];
      if (char === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
    }
  }
}

// Utility functions for AST traversal
export function traverseAST(nodes: HTMLNode[], callback: (node: HTMLNode) => void): void {
  if (!Array.isArray(nodes)) {
    return;
  }

  for (const node of nodes) {
    if (node) {
      callback(node);
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        traverseAST(node.children, callback);
      }
    }
  }
}

export function findNodesByTagName(nodes: HTMLNode[], tagName: string): HTMLNode[] {
  if (!Array.isArray(nodes) || !tagName) {
    return [];
  }

  const found: HTMLNode[] = [];

  traverseAST(nodes, (node) => {
    if (node.type === "element" && node.tagName === tagName.toLowerCase()) {
      found.push(node);
    }
  });

  return found;
}

export function findNodesByAttribute(
  nodes: HTMLNode[],
  attributeName: string,
  attributeValue?: string
): HTMLNode[] {
  if (!Array.isArray(nodes) || !attributeName) {
    return [];
  }

  const found: HTMLNode[] = [];

  traverseAST(nodes, (node) => {
    if (node.type === "element" && node.attributes?.[attributeName]) {
      if (!attributeValue || node.attributes[attributeName] === attributeValue) {
        found.push(node);
      }
    }
  });

  return found;
}
