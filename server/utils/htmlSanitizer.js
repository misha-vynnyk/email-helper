"use strict";
/**
 * HTML Sanitizer
 *
 * Sanitizes HTML content to prevent XSS attacks
 * Uses isomorphic-dompurify (works in Node.js without jsdom)
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHTML = sanitizeHTML;
exports.sanitizeHTMLStrict = sanitizeHTMLStrict;
exports.containsDangerousHTML = containsDangerousHTML;
exports.validateHTMLStructure = validateHTMLStructure;
var isomorphic_dompurify_1 = require("isomorphic-dompurify");
/**
 * Email-safe DOMPurify configuration
 */
var PURIFY_CONFIG = {
    // Allow common HTML email tags
    ALLOWED_TAGS: [
        "html",
        "head",
        "body",
        "title",
        "meta",
        "style",
        "table",
        "tbody",
        "thead",
        "tfoot",
        "tr",
        "td",
        "th",
        "div",
        "span",
        "p",
        "br",
        "hr",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "a",
        "img",
        "ul",
        "ol",
        "li",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "center",
        "font",
        "pre",
        "code",
    ],
    // Allow common attributes
    ALLOWED_ATTR: [
        "href",
        "src",
        "alt",
        "title",
        "width",
        "height",
        "style",
        "class",
        "id",
        "align",
        "valign",
        "border",
        "cellpadding",
        "cellspacing",
        "colspan",
        "rowspan",
        "bgcolor",
        "color",
        "target",
        "role",
    ],
    // Allow data URIs for images
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Keep relative URLs
    ALLOW_DATA_ATTR: false,
    // Keep HTML structure
    KEEP_CONTENT: true,
    // Return DOM instead of string for better control
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    // Prevent mXSS attacks
    SAFE_FOR_TEMPLATES: true,
    // Remove unsafe elements completely
    FORCE_BODY: false,
    // Allow SVG (common in email templates)
    USE_PROFILES: { html: true, svg: true, svgFilters: false },
};
/**
 * Sanitize HTML content
 */
function sanitizeHTML(dirty) {
    if (!dirty || typeof dirty !== "string") {
        return "";
    }
    try {
        // Remove null bytes
        var cleaned = dirty.replace(/\0/g, "");
        // Sanitize with DOMPurify
        var sanitized = isomorphic_dompurify_1.default.sanitize(cleaned, PURIFY_CONFIG);
        return sanitized;
    }
    catch (error) {
        console.error("HTML sanitization error:", error);
        // Return empty string on error for safety
        return "";
    }
}
/**
 * Sanitize HTML with strict mode (removes more tags)
 */
function sanitizeHTMLStrict(dirty) {
    if (!dirty || typeof dirty !== "string") {
        return "";
    }
    try {
        var cleaned = dirty.replace(/\0/g, "");
        var strictConfig = __assign(__assign({}, PURIFY_CONFIG), { ALLOWED_TAGS: ["p", "br", "strong", "em", "a"], ALLOWED_ATTR: ["href", "target"] });
        var sanitized = isomorphic_dompurify_1.default.sanitize(cleaned, strictConfig);
        return sanitized;
    }
    catch (error) {
        console.error("HTML sanitization error:", error);
        return "";
    }
}
/**
 * Check if HTML contains potentially dangerous content
 */
function containsDangerousHTML(html) {
    if (!html)
        return false;
    // Check for common XSS patterns
    var dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // event handlers like onclick=
        /<iframe/gi,
        /<object/gi,
        /<embed/gi,
        /<applet/gi,
        /<meta\s+http-equiv/gi,
    ];
    return dangerousPatterns.some(function (pattern) { return pattern.test(html); });
}
/**
 * Validate HTML structure (basic check)
 */
function validateHTMLStructure(html) {
    var errors = [];
    if (!html || html.trim().length === 0) {
        errors.push("HTML content is empty");
        return { valid: false, errors: errors };
    }
    // Check for balanced tags (basic check)
    var openTags = html.match(/<(\w+)[^>]*>/g) || [];
    var closeTags = html.match(/<\/(\w+)>/g) || [];
    if (openTags.length !== closeTags.length) {
        errors.push("Unbalanced HTML tags detected");
    }
    // Check for dangerous content
    if (containsDangerousHTML(html)) {
        errors.push("Potentially dangerous content detected");
    }
    return {
        valid: errors.length === 0,
        errors: errors,
    };
}
