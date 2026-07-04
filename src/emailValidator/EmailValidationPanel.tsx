import {
  Accessibility,
  Bug,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Gauge,
  Info,
  ListFilter,
  Mail,
  Monitor,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  Wand2,
  Wrench,
  X,
} from "lucide-react";
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { Note } from "../components/ui/primitives";
import { cn } from "../lib/utils";
import { logger } from "../utils/logger";
import { EmailHTMLValidator } from "./EmailHTMLValidator";
import { EmailValidationReport, ValidationResult, ValidationSeverity } from "./types";
import { EMAIL_VALIDATION_RULES } from "./validationRules";

const EmailValidationDevTools = import.meta.env.DEV
  ? lazy(() => import("./EmailValidationDevTools"))
  : null;

/* ------------------------------------------------------------------ */
/* Tone system (Tailwind classes per severity/category color)          */
/* ------------------------------------------------------------------ */

type Tone = "red" | "amber" | "sky" | "emerald" | "violet" | "primary";

const TONES: Record<
  Tone,
  { text: string; bgSoft: string; border: string; solid: string; bar: string }
> = {
  red: {
    text: "text-red-600 dark:text-red-400",
    bgSoft: "bg-red-500/10",
    border: "border-red-500/40",
    solid: "bg-red-600 hover:bg-red-500 text-white",
    bar: "bg-red-500",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    bgSoft: "bg-amber-500/10",
    border: "border-amber-500/40",
    solid: "bg-amber-600 hover:bg-amber-500 text-white",
    bar: "bg-amber-500",
  },
  sky: {
    text: "text-sky-600 dark:text-sky-400",
    bgSoft: "bg-sky-500/10",
    border: "border-sky-500/40",
    solid: "bg-sky-600 hover:bg-sky-500 text-white",
    bar: "bg-sky-500",
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    bgSoft: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    solid: "bg-emerald-600 hover:bg-emerald-500 text-white",
    bar: "bg-emerald-500",
  },
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    bgSoft: "bg-violet-500/10",
    border: "border-violet-500/40",
    solid: "bg-violet-600 hover:bg-violet-500 text-white",
    bar: "bg-violet-500",
  },
  primary: {
    text: "text-primary",
    bgSoft: "bg-primary/10",
    border: "border-primary/40",
    solid: "bg-primary hover:bg-primary/90 text-primary-foreground",
    bar: "bg-primary",
  },
};

const SEVERITY_TONE: Record<ValidationSeverity, Tone> = {
  error: "red",
  warning: "amber",
  info: "sky",
};

const SEVERITY_ICONS: Record<ValidationSeverity, typeof Info> = {
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
};

const CATEGORY_META: Record<string, { label: string; tone: Tone; Icon: typeof Info }> = {
  structure: { label: "Structure", tone: "primary", Icon: Wrench },
  accessibility: { label: "Accessibility", tone: "violet", Icon: Accessibility },
  compatibility: { label: "Compatibility", tone: "sky", Icon: Monitor },
  performance: { label: "Performance", tone: "amber", Icon: Gauge },
  "best-practice": { label: "Best Practice", tone: "emerald", Icon: ShieldCheck },
};

const getCategoryMeta = (category: string) =>
  CATEGORY_META[category] ?? { label: category, tone: "sky" as Tone, Icon: Info };

const scoreTone = (score: number): Tone => (score >= 80 ? "emerald" : score >= 60 ? "amber" : "red");

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Pill({
  tone,
  children,
  className,
  outlined = false,
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
  outlined?: boolean;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap",
        outlined ? cn("border bg-transparent", t.border, t.text) : cn(t.bgSoft, t.text),
        className
      )}
    >
      {children}
    </span>
  );
}

function FixButton({
  tone,
  onClick,
  disabled,
  isFixing,
  label,
  className,
}: {
  tone: Tone;
  onClick: (e: React.MouseEvent) => void;
  disabled: boolean;
  isFixing: boolean;
  label: string;
  className?: string;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none",
        TONES[tone].solid,
        className
      )}
    >
      <Wand2 className='w-3.5 h-3.5 shrink-0' />
      {isFixing ? "Fixing..." : label}
    </button>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-9 h-5 rounded-full transition-colors shrink-0 mt-1",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-4"
        )}
      />
    </button>
  );
}

const selectClass =
  "h-9 w-full rounded-xl border border-border bg-background px-2.5 text-xs text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

function TabHeading({ tone, Icon, children }: { tone: Tone; Icon: typeof Info; children: React.ReactNode }) {
  const t = TONES[tone];
  return (
    <h3
      className={cn(
        "flex items-center gap-2 p-3 rounded-xl border text-sm font-bold",
        t.bgSoft,
        t.border,
        t.text
      )}
    >
      <Icon className='w-4 h-4 shrink-0' />
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------------ */
/* Main panel                                                          */
/* ------------------------------------------------------------------ */

interface EmailValidationPanelProps {
  html: string;
  onHtmlChange?: (html: string) => void;
  validator?: EmailHTMLValidator;
  showCompactView?: boolean;
}

export const EmailValidationPanel: React.FC<EmailValidationPanelProps> = ({
  html,
  onHtmlChange,
  validator: propValidator,
  showCompactView = false,
}) => {
  const [validationReport, setValidationReport] = useState<EmailValidationReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<ValidationSeverity | "all">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Use provided validator or create default one
  const validator = useMemo(() => {
    return propValidator || new EmailHTMLValidator();
  }, [propValidator]);

  // Validate HTML
  useEffect(() => {
    if (!html || !html.trim()) {
      setValidationReport(null);
      return;
    }

    setIsValidating(true);

    // Debounce validation
    const timeoutId = setTimeout(() => {
      try {
        const report = validator.validate(html);
        setValidationReport(report);
      } catch (error: unknown) {
        logger.error("EmailValidationPanel", "Validation error", error);
        const errorMessage =
          error && typeof error === "object" && "message" in error
            ? (error as Error).message
            : "Unknown error";
        setValidationReport({
          isValid: false,
          errors: [
            {
              rule: "validation-error",
              severity: "error" as ValidationSeverity,
              message: `Validation failed: ${errorMessage}`,
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
        });
      } finally {
        setIsValidating(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [html, validator]);

  const handleAutoFix = async () => {
    if (!validationReport?.autoFixAvailable || !onHtmlChange) {
      logger.warn("EmailValidationPanel", "Auto-fix not available or no onHtmlChange callback");
      return;
    }

    setIsFixing(true);
    try {
      const { html: fixedHtml, fixed } = validator.autoFix(html);

      if (fixed.length > 0) {
        onHtmlChange(fixedHtml);
        alert(`Successfully fixed ${fixed.length} issues:\n${fixed.join("\n")}`);
      } else {
        alert("No issues were auto-fixed. All issues may already be resolved or not auto-fixable.");
      }
    } catch (error: unknown) {
      alert(
        `Error during auto-fix: ${error && typeof error === "object" && "message" in error ? (error as Error).message : "Unknown error"}`
      );
    } finally {
      setIsFixing(false);
    }
  };

  const handleSingleIssueFix = async (ruleName: string) => {
    if (!onHtmlChange) {
      return;
    }

    setIsFixing(true);
    try {
      const { html: fixedHtml, fixed } = validator.autoFixSpecificIssue(html, ruleName);

      if (fixed) {
        onHtmlChange(fixedHtml);
        alert(`Successfully fixed issue with rule: ${ruleName}`);
      } else {
        alert(`No changes made for rule: ${ruleName}. Issue may already be resolved.`);
      }
    } catch (error: unknown) {
      alert(
        `Error fixing issue: ${error && typeof error === "object" && "message" in error ? (error as Error).message : "Unknown error"}`
      );
    } finally {
      setIsFixing(false);
    }
  };

  const handleFixAllIssues = async (severity: ValidationSeverity) => {
    if (!onHtmlChange) {
      return;
    }

    setIsFixing(true);
    try {
      const { html: fixedHtml, fixed } = validator.autoFixAllIssues(html, severity);

      if (fixed.length > 0) {
        onHtmlChange(fixedHtml);
        alert(`Successfully fixed ${fixed.length} ${severity} issues:\n${fixed.join("\n")}`);
      } else {
        alert(
          `No ${severity} issues were fixed. All issues may already be resolved or not auto-fixable.`
        );
      }
    } catch (error: unknown) {
      alert(
        `Error fixing ${severity} issues: ${error && typeof error === "object" && "message" in error ? (error as Error).message : "Unknown error"}`
      );
    } finally {
      setIsFixing(false);
    }
  };

  const handleFixCategory = async (category: string) => {
    if (!onHtmlChange) {
      return;
    }

    setIsFixing(true);
    try {
      const { html: fixedHtml, fixed } = validator.autoFixCategory(html, category);

      if (fixed.length > 0) {
        onHtmlChange(fixedHtml);
        alert(
          `Successfully fixed ${fixed.length} issues in category ${category}:\n${fixed.join("\n")}`
        );
      } else {
        alert(
          `No issues in category ${category} were fixed. All issues may already be resolved or not auto-fixable.`
        );
      }
    } catch (error: unknown) {
      alert(
        `Error fixing category ${category} issues: ${error && typeof error === "object" && "message" in error ? (error as Error).message : "Unknown error"}`
      );
    } finally {
      setIsFixing(false);
    }
  };

  // Filter and search results
  const filteredResults = useMemo(() => {
    if (!validationReport) return { errors: [], warnings: [], suggestions: [] };

    const allResults = [
      ...validationReport.errors,
      ...validationReport.warnings,
      ...validationReport.suggestions,
    ];

    let filtered = allResults;

    // Filter by severity
    if (filterSeverity !== "all") {
      filtered = filtered.filter((result) => result.severity === filterSeverity);
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter((result) => result.category === filterCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (result) =>
          result.message.toLowerCase().includes(query) ||
          result.suggestion?.toLowerCase().includes(query) ||
          result.rule.toLowerCase().includes(query)
      );
    }

    return {
      errors: filtered.filter((r) => r.severity === "error"),
      warnings: filtered.filter((r) => r.severity === "warning"),
      suggestions: filtered.filter((r) => r.severity === "info"),
    };
  }, [validationReport, filterSeverity, filterCategory, searchQuery]);

  const renderValidationResults = (
    results: ValidationResult[],
    title: string,
    severity: ValidationSeverity
  ) => {
    if (!results || results.length === 0) return null;
    return (
      <IssueGroup
        key={severity}
        title={title}
        severity={severity}
        results={results}
        canFix={!!onHtmlChange}
        busy={isValidating || isFixing}
        isFixing={isFixing}
        onFixAll={() => handleFixAllIssues(severity)}
        onFixSingle={handleSingleIssueFix}
      />
    );
  };

  const renderCategorySummary = () => {
    if (!validationReport) return null;

    return (
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4'>
        {Object.keys(CATEGORY_META).map((key) => {
          const { label, tone, Icon } = CATEGORY_META[key];
          const t = TONES[tone];
          const count = validationReport.categories[key as keyof typeof validationReport.categories];
          const hasAutoFix =
            count > 0 &&
            validator.getRulesByCategory(key).some((rule) => EMAIL_VALIDATION_RULES[rule]?.autofix);

          return (
            <div
              key={key}
              role='button'
              tabIndex={0}
              onClick={() => setFilterCategory(key)}
              onKeyDown={(e) => e.key === "Enter" && setFilterCategory(key)}
              className={cn(
                "p-3 rounded-2xl border bg-card cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md",
                count > 0 ? cn(t.border, t.bgSoft) : "border-border/50"
              )}
            >
              <div className={cn("flex items-center gap-2 mb-2 text-sm font-bold", count > 0 ? t.text : "text-foreground")}>
                <Icon className='w-4 h-4 shrink-0' />
                {label}
              </div>

              <div className='flex items-center justify-between gap-2'>
                {count === 0 ? (
                  <Pill tone='emerald'>Perfect</Pill>
                ) : (
                  <Pill tone={tone} outlined>
                    {count} issues
                  </Pill>
                )}

                {hasAutoFix && onHtmlChange && count > 0 && (
                  <FixButton
                    tone={tone}
                    onClick={() => handleFixCategory(key)}
                    disabled={isValidating || isFixing}
                    isFixing={isFixing}
                    label={`Fix All (${count})`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFilters = () => {
    if (!validationReport) return null;

    const shownCount =
      filteredResults.errors.length +
      filteredResults.warnings.length +
      filteredResults.suggestions.length;
    const hasActiveFilters = filterSeverity !== "all" || filterCategory !== "all" || !!searchQuery.trim();

    return (
      <div className='p-4 mb-4 rounded-2xl border border-border/50 bg-card flex flex-col gap-3'>
        <div className='flex items-center gap-2 text-sm font-bold text-foreground'>
          <ListFilter className='w-4 h-4' />
          Filters & Search
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2'>
          <label className='flex flex-col gap-1'>
            <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>Severity</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as ValidationSeverity | "all")}
              className={selectClass}
            >
              <option value='all'>All Severities</option>
              <option value='error'>Errors</option>
              <option value='warning'>Warnings</option>
              <option value='info'>Suggestions</option>
            </select>
          </label>

          <label className='flex flex-col gap-1'>
            <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>Category</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={selectClass}
            >
              <option value='all'>All Categories</option>
              <option value='structure'>Structure</option>
              <option value='accessibility'>Accessibility</option>
              <option value='compatibility'>Compatibility</option>
              <option value='performance'>Performance</option>
              <option value='best-practice'>Best Practice</option>
            </select>
          </label>

          <label className='flex flex-col gap-1 sm:col-span-2'>
            <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>Search</span>
            <div className='relative'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none' />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search in messages, suggestions, or rules...'
                className={cn(selectClass, "pl-8")}
              />
            </div>
          </label>
        </div>

        <div className='flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-border/50 bg-background'>
          <span className='text-[11px] text-muted-foreground'>
            Showing {shownCount} of {validationReport.totalIssues} issues
          </span>
          {hasActiveFilters && (
            <button
              type='button'
              onClick={() => {
                setFilterSeverity("all");
                setFilterCategory("all");
                setSearchQuery("");
              }}
              className='text-[11px] font-bold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-full border border-border hover:bg-muted transition-colors'
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderCompatibilityReport = () => {
    if (!html || !html.trim()) {
      return null;
    }

    try {
      const compatibility = validator.getCompatibilityReport(html);

      return (
        <div className='mt-3 flex flex-col gap-2'>
          <h4 className='text-xs font-bold text-foreground'>Email Client Compatibility</h4>

          {Object.entries(compatibility).map(([client, report]) => (
            <div key={client}>
              <div className='flex items-center gap-2'>
                {client === "outlook" && <Monitor className='w-4 h-4 text-muted-foreground' />}
                {client === "gmail" && <Mail className='w-4 h-4 text-muted-foreground' />}
                {client === "mobile" && <Smartphone className='w-4 h-4 text-muted-foreground' />}

                <span className='flex-1 text-sm text-foreground capitalize'>{client}</span>

                <Pill tone={report.compatible ? "emerald" : "amber"} outlined>
                  {report.compatible ? "Compatible" : "Issues"}
                </Pill>
              </div>

              {!report.compatible && report.issues && report.issues.length > 0 && (
                <ul className='ml-6 mt-1 flex flex-col gap-0.5'>
                  {report.issues.map((issue, index) => (
                    <li key={index} className='text-[11px] text-amber-600 dark:text-amber-400'>
                      • {issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    } catch (error) {
      logger.error("EmailValidationPanel", "Error generating compatibility report", error);
      return <p className='mt-3 text-xs font-bold text-red-600 dark:text-red-400'>Error generating compatibility report</p>;
    }
  };

  if (!validationReport && !isValidating) {
    return null;
  }

  if (showCompactView) {
    return (
      <div className='flex items-center gap-2'>
        {isValidating ? (
          <Pill tone='sky'>Validating...</Pill>
        ) : isFixing ? (
          <Pill tone='amber'>Fixing...</Pill>
        ) : validationReport?.isValid ? (
          <Pill tone='emerald'>
            <CheckCircle2 className='w-3.5 h-3.5' />
            Email Safe
          </Pill>
        ) : (
          <Pill tone='red'>
            <CircleAlert className='w-3.5 h-3.5' />
            {validationReport?.totalIssues || 0} Issues
          </Pill>
        )}

        {validationReport && (
          <button
            type='button'
            onClick={() => setShowDetails(!showDetails)}
            className='p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showDetails && "rotate-180")} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className='p-4 rounded-2xl border border-border/50 bg-card shadow-soft'>
      {/* Header with Score */}
      <div className='flex flex-wrap items-center gap-2'>
        {isValidating ? (
          <Pill tone='sky'>
            <Bug className='w-3.5 h-3.5' />
            Validating...
          </Pill>
        ) : validationReport?.isValid ? (
          <Pill tone='emerald'>
            <CheckCircle2 className='w-3.5 h-3.5' />
            Email Safe
          </Pill>
        ) : (
          <Pill tone='red'>
            <CircleAlert className='w-3.5 h-3.5' />
            {validationReport?.errors?.length || 0} Errors
          </Pill>
        )}

        {validationReport && validationReport.warnings && validationReport.warnings.length > 0 && (
          <Pill tone='amber'>
            <TriangleAlert className='w-3.5 h-3.5' />
            {validationReport.warnings.length} Warnings
          </Pill>
        )}

        <div className='flex-1' />

        {/* Validation Score */}
        {validationReport && (
          <div className='flex items-center gap-1.5'>
            <span className='text-xs text-muted-foreground'>Score:</span>
            <Pill tone={scoreTone(validationReport.score)} outlined>
              {validationReport.score}/100
            </Pill>
          </div>
        )}

        <button
          type='button'
          title='Validation Settings'
          onClick={() => setShowSettings(true)}
          className='p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
        >
          <Settings className='w-4 h-4' />
        </button>

        {/* DEV-only: isolated dev tools (lazy-loaded) */}
        {EmailValidationDevTools && onHtmlChange && (
          <Suspense fallback={null}>
            <EmailValidationDevTools onHtmlChange={onHtmlChange} />
          </Suspense>
        )}

        {validationReport?.autoFixAvailable && onHtmlChange && (
          <FixButton
            tone='primary'
            onClick={handleAutoFix}
            disabled={isValidating || isFixing}
            isFixing={isFixing}
            label={`Auto-fix All (${validationReport.totalIssues})`}
          />
        )}

        <button
          type='button'
          onClick={() => setShowDetails(!showDetails)}
          className='flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
        >
          Details
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", showDetails && "rotate-180")} />
        </button>
      </div>

      {/* Quality score bar (not a progress indicator — validation is synchronous) */}
      {validationReport && (
        <div className='mt-3'>
          <div className='flex justify-between mb-1'>
            <span className='text-[11px] text-muted-foreground'>Quality Score</span>
            <span className='text-[11px] text-muted-foreground'>{validationReport.score}/100</span>
          </div>
          <div className='h-1.5 rounded-full bg-muted overflow-hidden'>
            <div
              className={cn("h-full rounded-full transition-all duration-300", TONES[scoreTone(validationReport.score)].bar)}
              style={{ width: `${validationReport.score}%` }}
            />
          </div>
        </div>
      )}

      {/* Details */}
      {showDetails && (
        <div className='mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-1 duration-200'>
          {/* Category Summary */}
          {validationReport && renderCategorySummary()}

          {/* Tabs */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 mb-4 rounded-full border border-border/50 bg-background'>
            {[
              { label: "Issues", Icon: Bug, badge: validationReport?.totalIssues || 0 },
              { label: "Compatibility", Icon: Monitor, badge: 0 },
              { label: "Performance", Icon: Gauge, badge: 0 },
              { label: "Settings", Icon: Settings, badge: 0 },
            ].map(({ label, Icon, badge }, index) => (
              <button
                key={label}
                type='button'
                onClick={() => setSelectedTab(index)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all duration-200",
                  selectedTab === index
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className='w-3.5 h-3.5 shrink-0' />
                {label}
                {badge > 0 && (
                  <span
                    className={cn(
                      "flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[9px]",
                      selectedTab === index ? "bg-primary-foreground/20 text-primary-foreground" : "bg-red-500 text-white"
                    )}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className='min-h-[200px] animate-in fade-in slide-in-from-right-2 duration-300' key={selectedTab}>
            {selectedTab === 0 && validationReport && (
              <div>
                <TabHeading tone='red' Icon={Bug}>
                  Issues & Validation Results
                </TabHeading>

                <div className='mt-4'>
                  {/* Filters */}
                  {renderFilters()}

                  {/* Results */}
                  {filteredResults.errors.length === 0 &&
                  filteredResults.warnings.length === 0 &&
                  filteredResults.suggestions.length === 0 ? (
                    <Note tone='info'>No issues match the current filters. Try adjusting your search criteria.</Note>
                  ) : (
                    <>
                      {renderValidationResults(filteredResults.errors, "Errors", "error")}
                      {renderValidationResults(filteredResults.warnings, "Warnings", "warning")}
                      {renderValidationResults(filteredResults.suggestions, "Suggestions", "info")}
                    </>
                  )}

                  {validationReport.totalIssues === 0 && (
                    <Note tone='success'>🎉 Your HTML is email-safe! No issues found.</Note>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 1 && (
              <div>
                <TabHeading tone='sky' Icon={Monitor}>
                  Email Client Compatibility
                </TabHeading>

                {renderCompatibilityReport()}

                {/* Additional compatibility info */}
                <Note tone='info' className='mt-4'>
                  <strong>💡 Compatibility Tips</strong>
                  <ul className='mt-1 flex flex-col gap-0.5'>
                    <li>
                      • <strong>Outlook:</strong> Use table-based layout, avoid flexbox/grid
                    </li>
                    <li>
                      • <strong>Gmail:</strong> Inline styles work best, external CSS may be stripped
                    </li>
                    <li>
                      • <strong>Mobile:</strong> Use responsive design with max-width
                    </li>
                  </ul>
                </Note>
              </div>
            )}

            {selectedTab === 2 && (
              <div>
                <TabHeading tone='amber' Icon={Gauge}>
                  Performance Analysis
                </TabHeading>

                {/* Performance metrics */}
                {validationReport && (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4'>
                    <div className='p-4 rounded-2xl border border-border/50 bg-card'>
                      <h4 className='text-xs font-bold text-foreground mb-1'>📊 File Size</h4>
                      <p className={cn("text-2xl font-black", TONES[validationReport.score >= 80 ? "emerald" : "amber"].text)}>
                        {(html.length / 1024).toFixed(1)} KB
                      </p>
                      <p className='text-[11px] text-muted-foreground mt-0.5'>
                        {validationReport.score >= 80 ? "✅ Optimal size" : "⚠️ Consider optimization"}
                      </p>
                    </div>

                    <div className='p-4 rounded-2xl border border-border/50 bg-card'>
                      <h4 className='text-xs font-bold text-foreground mb-1'>🎯 Validation Score</h4>
                      <p className={cn("text-2xl font-black", TONES[scoreTone(validationReport.score)].text)}>
                        {validationReport.score}/100
                      </p>
                      <p className='text-[11px] text-muted-foreground mt-0.5'>
                        {validationReport.score >= 80
                          ? "Excellent"
                          : validationReport.score >= 60
                            ? "Good"
                            : "Needs improvement"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Performance recommendations */}
                <Note tone='warning' className='mt-4'>
                  <strong>🚀 Performance Recommendations</strong>
                  <ul className='mt-1 flex flex-col gap-0.5'>
                    <li>• Keep HTML size under 102KB for optimal email delivery</li>
                    <li>• Use inline styles instead of external CSS</li>
                    <li>• Optimize images and use appropriate dimensions</li>
                    <li>• Minimize table nesting for better rendering</li>
                  </ul>
                </Note>
              </div>
            )}

            {selectedTab === 3 && (
              <div>
                <TabHeading tone='emerald' Icon={Settings}>
                  Validation Settings
                </TabHeading>

                {/* Quick settings */}
                <div className='mt-4'>
                  <h4 className='text-xs font-bold text-foreground mb-2'>Quick Actions</h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                    <button
                      type='button'
                      onClick={() => setShowSettings(true)}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold shadow-sm active:scale-95 transition-all",
                        TONES.primary.solid
                      )}
                    >
                      <Wand2 className='w-4 h-4' />
                      Advanced Settings
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setFilterSeverity("all");
                        setFilterCategory("all");
                        setSearchQuery("");
                      }}
                      className='flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all'
                    >
                      <ListFilter className='w-4 h-4' />
                      Reset Filters
                    </button>
                  </div>
                </div>

                {/* Current configuration summary */}
                <div className='mt-4 p-4 rounded-2xl bg-muted/50 border border-border/50'>
                  <h4 className='text-xs font-bold text-foreground mb-2'>Current Configuration</h4>
                  <ul className='flex flex-col gap-1 text-sm text-foreground'>
                    <li>• Severity Filter: {filterSeverity === "all" ? "All" : filterSeverity}</li>
                    <li>• Category Filter: {filterCategory === "all" ? "All" : filterCategory}</li>
                    <li>• Search Query: {searchQuery || "None"}</li>
                    <li>• Total Rules: {Object.keys(EMAIL_VALIDATION_RULES).length}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Dialog */}
      <ValidationSettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        validator={validator}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Issue accordion group                                               */
/* ------------------------------------------------------------------ */

interface IssueGroupProps {
  title: string;
  severity: ValidationSeverity;
  results: ValidationResult[];
  canFix: boolean;
  busy: boolean;
  isFixing: boolean;
  onFixAll: () => void;
  onFixSingle: (ruleName: string) => void;
}

function IssueGroup({ title, severity, results, canFix, busy, isFixing, onFixAll, onFixSingle }: IssueGroupProps) {
  const [open, setOpen] = useState(severity === "error");
  const tone = SEVERITY_TONE[severity];
  const t = TONES[tone];
  const SeverityIcon = SEVERITY_ICONS[severity];
  const fixableCount = results.filter((r) => r.autoFixAvailable).length;

  return (
    <div className={cn("mb-3 rounded-2xl border overflow-hidden bg-card", t.border)}>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cn("flex items-center gap-2.5 w-full px-4 py-3 text-left transition-colors", t.bgSoft)}
      >
        <SeverityIcon className={cn("w-4 h-4 shrink-0", t.text)} />
        <span className={cn("text-sm font-bold", t.text)}>
          {title} ({results.length})
        </span>
        <div className='flex-1' />
        {fixableCount > 0 && canFix && (
          <FixButton
            tone={tone}
            onClick={(e) => {
              e.stopPropagation();
              onFixAll();
            }}
            disabled={busy}
            isFixing={isFixing}
            label={`Fix All (${fixableCount})`}
          />
        )}
        <ChevronDown className={cn("w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <ul className='divide-y divide-border/50'>
          {results.map((result, index) => {
            const categoryMeta = result.category ? getCategoryMeta(result.category) : null;
            return (
              <li key={`${result.rule}-${index}`} className='flex items-start gap-2.5 px-4 py-3'>
                <SeverityIcon className={cn("w-4 h-4 shrink-0 mt-0.5", TONES[SEVERITY_TONE[result.severity]].text)} />

                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-foreground'>{result.message}</p>

                  {result.line && (
                    <p className='text-[11px] text-muted-foreground mt-1'>
                      📍 Line {result.line}
                      {result.column && `, Column ${result.column}`}
                    </p>
                  )}

                  {result.suggestion && (
                    <p className='mt-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-muted/50 text-[11px] italic text-muted-foreground'>
                      💡 {result.suggestion}
                    </p>
                  )}

                  <div className='flex flex-wrap items-center gap-1.5 mt-2'>
                    {categoryMeta && (
                      <Pill tone={categoryMeta.tone} outlined>
                        <categoryMeta.Icon className='w-3 h-3' />
                        {categoryMeta.label}
                      </Pill>
                    )}
                    <span className='inline-flex items-center px-2 py-0.5 rounded-full border border-border text-[10px] font-mono text-muted-foreground'>
                      {result.rule}
                    </span>
                  </div>
                </div>

                {result.autoFixAvailable && canFix && (
                  <button
                    type='button'
                    title='Fix this issue'
                    onClick={() => onFixSingle(result.rule)}
                    className='p-2 rounded-full text-primary hover:bg-primary/10 transition-colors shrink-0'
                  >
                    <Wand2 className='w-4 h-4' />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings Dialog                                                     */
/* ------------------------------------------------------------------ */

interface ValidationSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  validator: EmailHTMLValidator;
}

function SettingRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
}) {
  return (
    <div className='flex items-start gap-3 p-1.5 rounded-xl hover:bg-muted/50 transition-colors'>
      <Toggle checked={checked} onChange={onChange} />
      <div className='flex-1 px-2.5 py-1.5 rounded-lg border border-border/50 bg-muted/40'>
        <p className='text-sm font-medium text-foreground'>{title}</p>
        {description && <p className='text-[11px] text-muted-foreground mt-0.5'>{description}</p>}
      </div>
    </div>
  );
}

const ValidationSettingsDialog: React.FC<ValidationSettingsDialogProps> = ({
  open,
  onClose,
  validator,
}) => {
  const [config, setConfig] = useState(validator.getConfig());
  const availableRules = validator.getAvailableRules();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleSave = () => {
    try {
      validator.updateConfig(config);
      onClose();
    } catch (error) {
      logger.error("ValidationSettingsDialog", "Error saving validation config", error);
    }
  };

  const handleRuleToggle = (ruleName: string, enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [ruleName]: {
          ...prev.rules[ruleName],
          enabled,
        },
      },
    }));
  };

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-[1300] flex items-center justify-center p-4'>
      <div className='absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200' onClick={onClose} />

      <div
        role='dialog'
        aria-modal='true'
        aria-label='Validation Settings'
        className='relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border/50 bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200'
      >
        {/* Header */}
        <div className='flex items-center justify-between px-5 py-4 border-b border-border/50'>
          <h2 className='text-base font-bold text-foreground'>Validation Settings</h2>
          <button
            type='button'
            aria-label='Close'
            onClick={onClose}
            className='p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
          >
            <X className='w-4 h-4' />
          </button>
        </div>

        {/* Scrollable content */}
        <div className='flex-1 overflow-y-auto p-5 flex flex-col gap-5'>
          <section>
            <TabHeading tone='sky' Icon={Bug}>
              Validation Rules
            </TabHeading>
            <div className='mt-3 flex flex-col gap-1'>
              {Object.entries(availableRules).map(([ruleName, rule]) => (
                <SettingRow
                  key={ruleName}
                  checked={config.rules[ruleName]?.enabled ?? rule.enabled}
                  onChange={(enabled) => handleRuleToggle(ruleName, enabled)}
                  title={rule.displayName}
                  description={rule.description}
                />
              ))}
            </div>
          </section>

          <section>
            <TabHeading tone='amber' Icon={Monitor}>
              Target Email Clients
            </TabHeading>
            <div className='mt-3 flex flex-col gap-1'>
              {Object.entries(config.targetClients).map(([client, enabled]) => (
                <SettingRow
                  key={client}
                  checked={enabled}
                  onChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      targetClients: {
                        ...prev.targetClients,
                        [client]: checked,
                      },
                    }))
                  }
                  title={client.charAt(0).toUpperCase() + client.slice(1)}
                />
              ))}
            </div>
          </section>

          <section className='p-4 rounded-2xl border border-violet-500/40 bg-violet-500/10'>
            <h3 className='flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400 mb-3'>
              <Settings className='w-4 h-4' />
              Advanced Options
            </h3>

            {/* HTML Size Limit */}
            <label className='flex flex-col gap-1 mb-3'>
              <span className='text-sm font-medium text-foreground'>Max HTML Size (KB)</span>
              <input
                type='number'
                min={1}
                max={1000}
                value={Math.round(config.maxHtmlSize / 1024)}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    setConfig((prev) => ({ ...prev, maxHtmlSize: value * 1024 }));
                  }
                }}
                className={cn(selectClass, "w-32")}
              />
              <span className='text-[11px] text-muted-foreground'>Current: {Math.round(config.maxHtmlSize / 1024)}KB</span>
            </label>

            <SettingRow
              checked={config.strictMode}
              onChange={(checked) => setConfig((prev) => ({ ...prev, strictMode: checked }))}
              title='Strict Mode (treat warnings as errors)'
            />
          </section>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-end gap-2 px-5 py-4 border-t border-border/50'>
          <button
            type='button'
            onClick={onClose}
            className='px-5 py-2 rounded-full text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            className={cn("px-5 py-2 rounded-full text-sm font-bold shadow-sm active:scale-95 transition-all", TONES.primary.solid)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailValidationPanel;
