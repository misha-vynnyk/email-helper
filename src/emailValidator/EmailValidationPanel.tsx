import React, { Suspense, lazy, useEffect, useMemo, useState } from "react";

import {
  Accessibility,
  AutoFixHigh,
  BugReport,
  Build,
  CheckCircle,
  Computer,
  Email,
  Error,
  ExpandLess,
  ExpandMore,
  FilterList,
  Info,
  PhoneAndroid,
  Search,
  Security,
  Settings,
  Speed,
  Warning,
} from "@mui/icons-material";
import { alpha } from "@mui/material/styles";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { EmailHTMLValidator } from "./EmailHTMLValidator";
import { EmailValidationReport, ValidationResult, ValidationSeverity } from "./types";
import { EMAIL_VALIDATION_RULES } from "./validationRules";
import { logger } from "../utils/logger";

const EmailValidationDevTools = import.meta.env.DEV
  ? lazy(() => import("./EmailValidationDevTools"))
  : null;

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
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = useMemo(() => getComponentStyles(mode, style), [mode, style]);
  const surfaceSx = useMemo(
    () => ({
      borderRadius: `${componentStyles.card.borderRadius}px`,
      background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.8),
      backdropFilter: componentStyles.card.backdropFilter,
      WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
      border: componentStyles.card.border,
      boxShadow: componentStyles.card.boxShadow,
    }),
    [componentStyles, theme.palette.background.paper]
  );

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

  const getSeverityIcon = (severity: ValidationSeverity) => {
    switch (severity) {
      case "error":
        return <Error color='error' />;
      case "warning":
        return <Warning color='warning' />;
      case "info":
        return <Info color='info' />;
      default:
        return <Info />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "structure":
        return <Build color='primary' />;
      case "accessibility":
        return <Accessibility color='secondary' />;
      case "compatibility":
        return <Computer color='info' />;
      case "performance":
        return <Speed color='warning' />;
      case "best-practice":
        return <Security color='success' />;
      default:
        return <Info />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "structure":
        return "primary";
      case "accessibility":
        return "secondary";
      case "compatibility":
        return "info";
      case "performance":
        return "warning";
      case "best-practice":
        return "success";
      default:
        return "default";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "structure":
        return "Structure";
      case "accessibility":
        return "Accessibility";
      case "compatibility":
        return "Compatibility";
      case "performance":
        return "Performance";
      case "best-practice":
        return "Best Practice";
      default:
        return category;
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

    const severityColor =
      severity === "error" ? "error" : severity === "warning" ? "warning" : "info";
    const severityPalette =
      severityColor === "error"
        ? theme.palette.error
        : severityColor === "warning"
          ? theme.palette.warning
          : theme.palette.info;
    const severityRing = alpha(severityPalette.main, theme.palette.mode === "dark" ? 0.6 : 0.35);
    const accordionBorder =
      componentStyles.card.border === "none" ? "none" : `1px solid ${severityRing}`;
    const accordionBoxShadow =
      componentStyles.card.border === "none"
        ? `${componentStyles.card.boxShadow}, 0 0 0 1px ${severityRing}`
        : componentStyles.card.boxShadow;

    return (
      <Accordion
        defaultExpanded={severity === "error"}
        sx={{
          mb: 2,
          "&:before": { display: "none" },
          borderRadius: `${componentStyles.card.borderRadius}px`,
          background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.8),
          backdropFilter: componentStyles.card.backdropFilter,
          WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
          border: accordionBorder,
          boxShadow: accordionBoxShadow,
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            backgroundColor: alpha(severityPalette.main, theme.palette.mode === "dark" ? 0.22 : 0.08),
            borderRadius: `${componentStyles.card.borderRadius}px ${componentStyles.card.borderRadius}px 0 0`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            {getSeverityIcon(severity)}
            <Typography
              variant='subtitle1'
              component='div'
              fontWeight='bold'
            >
              {title} ({results.length})
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {results.some((r) => r.autoFixAvailable) && onHtmlChange && (
              <Button
                size='small'
                variant='contained'
                startIcon={<AutoFixHigh />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFixAllIssues(severity);
                }}
                disabled={isValidating || isFixing}
                color={severityColor}
                sx={{ minWidth: "auto" }}
              >
                {isFixing
                  ? "Fixing..."
                  : `Fix All (${results.filter((r) => r.autoFixAvailable).length})`}
              </Button>
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List
            dense
            sx={{ p: 0 }}
          >
            {results.map((result, index) => (
              <ListItem
                key={`${result.rule}-${index}`}
                sx={{
                  px: 2,
                  py: 1,
                  borderBottom: index < results.length - 1 ? "1px solid" : "none",
                  borderBottomColor: "divider",
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getSeverityIcon(result.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant='body2'
                      component='div'
                      fontWeight='medium'
                    >
                      {result.message}
                    </Typography>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {result.line && (
                        <Typography
                          variant='caption'
                          component='div'
                          color='text.secondary'
                          sx={{ mb: 0.5 }}
                        >
                          📍 Line {result.line}
                          {result.column && `, Column ${result.column}`}
                        </Typography>
                      )}
                      {result.suggestion && (
                        <Typography
                          variant='caption'
                          component='div'
                          display='block'
                          sx={{
                            mt: 0.5,
                            fontStyle: "italic",
                            backgroundColor: "action.hover",
                            p: 1,
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        >
                          💡 {result.suggestion}
                        </Typography>
                      )}
                      {result.category && (
                        <Chip
                          size='small'
                          icon={getCategoryIcon(result.category)}
                          label={getCategoryLabel(result.category)}
                          color={
                            getCategoryColor(result.category) as
                              | "primary"
                              | "secondary"
                              | "info"
                              | "warning"
                              | "success"
                              | "default"
                          }
                          variant='outlined'
                          sx={{ mt: 1, mr: 1 }}
                        />
                      )}
                      <Chip
                        size='small'
                        label={result.rule}
                        variant='outlined'
                        sx={{ mt: 1, fontSize: "0.7rem" }}
                      />
                    </Box>
                  }
                  primaryTypographyProps={{ component: "div" }}
                  secondaryTypographyProps={{ component: "div" }}
                />
                {result.autoFixAvailable && onHtmlChange && (
                  <Tooltip title='Fix this issue'>
                    <IconButton
                      size='small'
                      onClick={() => handleSingleIssueFix(result.rule)}
                      sx={{ ml: 1 }}
                      color='primary'
                    >
                      <AutoFixHigh fontSize='small' />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderCategorySummary = () => {
    if (!validationReport) return null;

    const categories = [
      { key: "structure", label: "Structure", icon: <Build />, color: "primary" as const },
      {
        key: "accessibility",
        label: "Accessibility",
        icon: <Accessibility />,
        color: "secondary" as const,
      },
      { key: "compatibility", label: "Compatibility", icon: <Computer />, color: "info" as const },
      { key: "performance", label: "Performance", icon: <Speed />, color: "warning" as const },
      {
        key: "best-practice",
        label: "Best Practice",
        icon: <Security />,
        color: "success" as const,
      },
    ];

    return (
      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >
        {categories.map((category) => {
          const count =
            validationReport.categories[category.key as keyof typeof validationReport.categories];
          const hasAutoFix =
            count > 0 &&
            validator
              .getRulesByCategory(category.key)
              .some((rule) => EMAIL_VALIDATION_RULES[rule]?.autofix);

          return (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={category.key}
            >
              <Card
                variant='outlined'
                onClick={() => setFilterCategory(category.key)}
                sx={{
                  borderRadius: `${componentStyles.card.borderRadius}px`,
                  background: (() => {
                    const base =
                      componentStyles.card.background || alpha(theme.palette.background.paper, 0.8);
                    if (count <= 0) return base;

                    const main =
                      ((theme.palette as any)[category.color]?.main as string | undefined) ??
                      theme.palette.primary.main;
                    const overlay = alpha(main, theme.palette.mode === "dark" ? 0.18 : 0.06);
                    return `linear-gradient(0deg, ${overlay}, ${overlay}), ${base}`;
                  })(),
                  backdropFilter: componentStyles.card.backdropFilter,
                  WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
                  border: (() => {
                    if (count <= 0) return componentStyles.card.border;
                    const main =
                      ((theme.palette as any)[category.color]?.main as string | undefined) ??
                      theme.palette.primary.main;
                    const ring = alpha(main, theme.palette.mode === "dark" ? 0.7 : 0.45);
                    return componentStyles.card.border === "none"
                      ? componentStyles.card.border
                      : `1px solid ${ring}`;
                  })(),
                  boxShadow: (() => {
                    if (count <= 0) return componentStyles.card.boxShadow;
                    if (componentStyles.card.border !== "none") return componentStyles.card.boxShadow;
                    const main =
                      ((theme.palette as any)[category.color]?.main as string | undefined) ??
                      theme.palette.primary.main;
                    const ring = alpha(main, theme.palette.mode === "dark" ? 0.7 : 0.45);
                    return `${componentStyles.card.boxShadow}, 0 0 0 1px ${ring}`;
                  })(),
                  transition: (theme) =>
                    theme.transitions.create(["transform", "box-shadow", "border"], {
                      duration: theme.transitions.duration.short,
                    }),
                  cursor: "pointer",
                  "&:hover": {
                    transform: componentStyles.card.hover?.transform || "translateY(-4px)",
                    boxShadow: componentStyles.card.hover?.boxShadow || ((theme) => theme.shadows[4]),
                    border: componentStyles.card.hover?.border || undefined,
                  },
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Box sx={{ color: `${category.color}.main` }}>{category.icon}</Box>
                    <Typography
                      variant='body2'
                      component='div'
                      fontWeight='bold'
                    >
                      {category.label}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <Badge
                      badgeContent={count}
                      color={category.color}
                    >
                      <Chip
                        size='small'
                        label={count === 0 ? "Perfect" : `${count} issues`}
                        color={count === 0 ? "success" : category.color}
                        variant={count === 0 ? "filled" : "outlined"}
                      />
                    </Badge>

                    {hasAutoFix && onHtmlChange && count > 0 && (
                      <Button
                        size='small'
                        variant='contained'
                        startIcon={<AutoFixHigh />}
                        onClick={() => handleFixCategory(category.key)}
                        disabled={isValidating || isFixing}
                        color={category.color}
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          fontWeight: 500,
                          boxShadow: (theme) => theme.shadows[1],
                          "&:hover": {
                            boxShadow: (theme) => theme.shadows[3],
                          },
                        }}
                      >
                        {isFixing ? "Fixing..." : `Fix All (${count})`}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderFilters = () => {
    if (!validationReport) return null;

    return (
      <Box
        sx={{
          mb: 3,
          p: 3,
          ...surfaceSx,
        }}
      >
        <Typography
          variant='subtitle2'
          component='div'
          sx={{
            mb: 2,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "text.primary",
          }}
        >
          <FilterList fontSize='small' />
          Filters & Search
        </Typography>

        <Grid
          container
          spacing={2}
          alignItems='center'
        >
          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <FormControl
              fullWidth
              size='small'
            >
              <InputLabel>Severity</InputLabel>
              <Select
                value={filterSeverity}
                label='Severity'
                onChange={(e) => setFilterSeverity(e.target.value as ValidationSeverity | "all")}
              >
                <MenuItem value='all'>All Severities</MenuItem>
                <MenuItem value='error'>Errors</MenuItem>
                <MenuItem value='warning'>Warnings</MenuItem>
                <MenuItem value='info'>Suggestions</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid
            item
            xs={12}
            sm={6}
            md={3}
          >
            <FormControl
              fullWidth
              size='small'
            >
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                label='Category'
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <MenuItem value='all'>All Categories</MenuItem>
                <MenuItem value='structure'>Structure</MenuItem>
                <MenuItem value='accessibility'>Accessibility</MenuItem>
                <MenuItem value='compatibility'>Compatibility</MenuItem>
                <MenuItem value='performance'>Performance</MenuItem>
                <MenuItem value='best-practice'>Best Practice</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid
            item
            xs={12}
            sm={12}
            md={6}
          >
            <TextField
              fullWidth
              size='small'
              placeholder='Search in messages, suggestions, or rules...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search fontSize='small' />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1,
            backgroundColor: "background.paper",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant='caption'
            color='text.secondary'
          >
            Showing{" "}
            {filteredResults.errors.length +
              filteredResults.warnings.length +
              filteredResults.suggestions.length}{" "}
            of {validationReport.totalIssues} issues
          </Typography>
          {(filterSeverity !== "all" || filterCategory !== "all" || searchQuery.trim()) && (
            <Button
              size='small'
              variant='outlined'
              color='secondary'
              onClick={() => {
                setFilterSeverity("all");
                setFilterCategory("all");
                setSearchQuery("");
              }}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 500,
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Box>
    );
  };

  const renderCompatibilityReport = () => {
    if (!html || !html.trim()) {
      return null;
    }

    try {
      const compatibility = validator.getCompatibilityReport(html);

      return (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant='subtitle2'
            component='div'
            sx={{ mb: 1, fontWeight: "bold" }}
          >
            Email Client Compatibility
          </Typography>

          {Object.entries(compatibility).map(([client, report]) => (
            <Box
              key={client}
              sx={{ mb: 1 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {client === "outlook" && <Computer fontSize='small' />}
                {client === "gmail" && <Email fontSize='small' />}
                {client === "mobile" && <PhoneAndroid fontSize='small' />}

                <Typography
                  variant='body2'
                  component='div'
                  sx={{ textTransform: "capitalize", flexGrow: 1 }}
                >
                  {client}
                </Typography>

                <Chip
                  size='small'
                  label={report.compatible ? "Compatible" : "Issues"}
                  color={report.compatible ? "success" : "warning"}
                  variant='outlined'
                />
              </Box>

              {!report.compatible && report.issues && report.issues.length > 0 && (
                <Box sx={{ ml: 3, mt: 0.5 }}>
                  {report.issues.map((issue, index) => (
                    <Typography
                      key={index}
                      variant='caption'
                      component='div'
                      color='warning.main'
                      display='block'
                    >
                      • {issue}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      );
    } catch (error) {
      logger.error("EmailValidationPanel", "Error generating compatibility report", error);
      return (
        <Box sx={{ mt: 2 }}>
          <Typography
            variant='subtitle2'
            component='div'
            color='error'
          >
            Error generating compatibility report
          </Typography>
        </Box>
      );
    }
  };

  if (!validationReport && !isValidating) {
    return null;
  }

  if (showCompactView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {isValidating ? (
          <Chip
            size='small'
            label='Validating...'
            color='info'
          />
        ) : isFixing ? (
          <Chip
            size='small'
            label='Fixing...'
            color='warning'
          />
        ) : validationReport?.isValid ? (
          <Chip
            size='small'
            icon={<CheckCircle />}
            label='Email Safe'
            color='success'
          />
        ) : (
          <Chip
            size='small'
            icon={<Error />}
            label={`${validationReport?.totalIssues || 0} Issues`}
            color='error'
          />
        )}

        {validationReport && (
          <IconButton
            size='small'
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )}
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2, ...surfaceSx }}>
      {/* CSS Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes slideIn {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }

          .tab-content {
            animation: slideIn 0.3s ease-out;
          }
        `}
      </style>
      {/* Header with Score */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isValidating ? (
            <Chip
              icon={<BugReport />}
              label='Validating...'
              color='info'
            />
          ) : validationReport?.isValid ? (
            <Chip
              icon={<CheckCircle />}
              label='Email Safe'
              color='success'
            />
          ) : (
            <Chip
              icon={<Error />}
              label={`${validationReport?.errors?.length || 0} Errors`}
              color='error'
            />
          )}

          {validationReport &&
            validationReport.warnings &&
            validationReport.warnings.length > 0 && (
              <Chip
                icon={<Warning />}
                label={`${validationReport.warnings.length} Warnings`}
                color='warning'
              />
            )}
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Validation Score */}
        {validationReport && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant='body2'
              color='text.secondary'
            >
              Score:
            </Typography>
            <Chip
              label={`${validationReport.score}/100`}
              color={
                validationReport.score >= 80
                  ? "success"
                  : validationReport.score >= 60
                    ? "warning"
                    : "error"
              }
              variant='outlined'
              size='small'
            />
          </Box>
        )}

        <Tooltip title='Validation Settings'>
          <IconButton
            size='small'
            onClick={() => setShowSettings(true)}
          >
            <Settings />
          </IconButton>
        </Tooltip>

        {/* DEV-only: isolated dev tools (lazy-loaded) */}
        {EmailValidationDevTools && onHtmlChange && (
          <Suspense fallback={null}>
            <EmailValidationDevTools onHtmlChange={onHtmlChange} />
          </Suspense>
        )}

        {validationReport?.autoFixAvailable && onHtmlChange && (
          <Tooltip title='Auto-fix All Issues'>
            <Button
              size='small'
              variant='contained'
              startIcon={<AutoFixHigh />}
              onClick={handleAutoFix}
              disabled={isValidating || isFixing}
              color='primary'
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 500,
                boxShadow: (theme) => theme.shadows[2],
                "&:hover": {
                  boxShadow: (theme) => theme.shadows[4],
                },
              }}
            >
              {isFixing ? "Fixing..." : `Auto-fix All (${validationReport.totalIssues})`}
            </Button>
          </Tooltip>
        )}

        <Button
          size='small'
          onClick={() => setShowDetails(!showDetails)}
          endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
          variant='outlined'
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            borderColor: "divider",
            color: "text.secondary",
            "&:hover": {
              borderColor: "text.primary",
              backgroundColor: "action.hover",
            },
          }}
        >
          Details
        </Button>
      </Box>

      {/* Progress Bar */}
      {validationReport && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography
              variant='caption'
              color='text.secondary'
            >
              Validation Progress
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
            >
              {validationReport.score}%
            </Typography>
          </Box>
          <LinearProgress
            variant='determinate'
            value={validationReport.score}
            color={
              validationReport.score >= 80
                ? "success"
                : validationReport.score >= 60
                  ? "warning"
                  : "error"
            }
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      )}

      {/* Details */}
      <Collapse in={showDetails}>
        <Divider sx={{ mb: 2 }} />

        {/* Category Summary */}
        {validationReport && renderCategorySummary()}

        <Box
          sx={{
            mb: 2,
            borderBottom: "1px solid",
            borderBottomColor: "divider",
            background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.7),
            backdropFilter: componentStyles.card.backdropFilter,
            WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
            borderRadius: "8px 8px 0 0",
            p: 1,
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={(_, value) => setSelectedTab(value)}
            sx={{
              "& .MuiTab-root": {
                minHeight: 48,
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                transition: "all 0.2s ease-in-out",
                borderRadius: "8px 8px 0 0",
                margin: "0 4px",
                color: "text.secondary",
              },
              "& .Mui-selected": {
                fontWeight: 600,
                color: "primary.main",
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.24 : 0.08),
              },
              "& .MuiTabs-indicator": {
                height: 4,
                borderRadius: "4px 4px 0 0",
                backgroundColor: "primary.main",
                boxShadow: (theme) => theme.shadows[2],
              },
              "& .MuiTab-root:hover": {
                backgroundColor: (theme) =>
                  alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.16 : 0.04),
                transform: "translateY(-1px)",
              },
            }}
            variant='fullWidth'
            textColor='primary'
            indicatorColor='primary'
          >
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BugReport fontSize='small' />
                  Issues
                  {validationReport && validationReport.totalIssues > 0 && (
                    <Badge
                      badgeContent={validationReport.totalIssues}
                      color='error'
                      sx={{ ml: 1 }}
                      max={99}
                    />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Computer fontSize='small' />
                  Compatibility
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Speed fontSize='small' />
                  Performance
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Settings fontSize='small' />
                  Settings
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box
          className='tab-content'
          sx={{
            minHeight: 200,
            position: "relative",
            p: 2,
            background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.8),
            backdropFilter: componentStyles.card.backdropFilter,
            WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
            borderRadius: `0 0 ${componentStyles.card.borderRadius}px ${componentStyles.card.borderRadius}px`,
            border: componentStyles.card.border,
            boxShadow: componentStyles.card.boxShadow,
            borderTop: "none",
          }}
        >
          {selectedTab === 0 && validationReport && (
            <Box>
              <Typography
                variant='h6'
                component='div'
                sx={{
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.22 : 0.08),
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.6 : 0.35),
                  color: "error.main",
                  fontWeight: 600,
                  boxShadow: (theme) => theme.shadows[1],
                }}
              >
                <BugReport color='error' />
                Issues & Validation Results
              </Typography>

              {/* Filters */}
              {renderFilters()}

              {/* Results */}
              {filteredResults.errors.length === 0 &&
              filteredResults.warnings.length === 0 &&
              filteredResults.suggestions.length === 0 ? (
                <Alert
                  severity='info'
                  sx={{ borderRadius: 2 }}
                >
                  No issues match the current filters. Try adjusting your search criteria.
                </Alert>
              ) : (
                <>
                  {renderValidationResults(filteredResults.errors, "Errors", "error")}
                  {renderValidationResults(filteredResults.warnings, "Warnings", "warning")}
                  {renderValidationResults(filteredResults.suggestions, "Suggestions", "info")}
                </>
              )}

              {validationReport.totalIssues === 0 && (
                <Alert
                  severity='success'
                  sx={{ borderRadius: 2 }}
                >
                  🎉 Your HTML is email-safe! No issues found.
                </Alert>
              )}
            </Box>
          )}

          {selectedTab === 1 && (
            <Box>
              <Typography
                variant='h6'
                component='div'
                sx={{
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.22 : 0.08),
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.6 : 0.35),
                  color: "info.main",
                }}
              >
                <Computer color='info' />
                Email Client Compatibility
              </Typography>
              {renderCompatibilityReport()}

              {/* Additional compatibility info */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.18 : 0.08),
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.6 : 0.35),
                }}
              >
                <Typography
                  variant='subtitle2'
                  component='div'
                  sx={{ mb: 1, fontWeight: "bold" }}
                >
                  💡 Compatibility Tips
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 1 }}
                >
                  • <strong>Outlook:</strong> Use table-based layout, avoid flexbox/grid
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 1 }}
                >
                  • <strong>Gmail:</strong> Inline styles work best, external CSS may be stripped
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 1 }}
                >
                  • <strong>Mobile:</strong> Use responsive design with max-width
                </Typography>
              </Box>
            </Box>
          )}

          {selectedTab === 2 && (
            <Box>
              <Typography
                variant='h6'
                component='div'
                sx={{
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.22 : 0.08),
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.6 : 0.35),
                  color: "warning.main",
                  fontWeight: 600,
                  boxShadow: (theme) => theme.shadows[1],
                }}
              >
                <Speed color='warning' />
                Performance Analysis
              </Typography>

              {/* Performance metrics */}
              {validationReport && (
                <Grid
                  container
                  spacing={2}
                  sx={{ mb: 3 }}
                >
                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Card
                      variant='outlined'
                      sx={{ p: 2, ...surfaceSx }}
                    >
                      <Typography
                        variant='subtitle2'
                        component='div'
                        sx={{ mb: 1, fontWeight: "bold" }}
                      >
                        📊 File Size
                      </Typography>
                      <Typography
                        variant='h4'
                        component='div'
                        color={validationReport.score >= 80 ? "success.main" : "warning.main"}
                      >
                        {(html.length / 1024).toFixed(1)} KB
                      </Typography>
                      <Typography
                        variant='caption'
                        component='div'
                        color='text.secondary'
                      >
                        {validationReport.score >= 80
                          ? "✅ Optimal size"
                          : "⚠️ Consider optimization"}
                      </Typography>
                    </Card>
                  </Grid>

                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Card
                      variant='outlined'
                      sx={{ p: 2, ...surfaceSx }}
                    >
                      <Typography
                        variant='subtitle2'
                        component='div'
                        sx={{ mb: 1, fontWeight: "bold" }}
                      >
                        🎯 Validation Score
                      </Typography>
                      <Typography
                        variant='h4'
                        component='div'
                        color={
                          validationReport.score >= 80
                            ? "success.main"
                            : validationReport.score >= 60
                              ? "warning.main"
                              : "error.main"
                        }
                      >
                        {validationReport.score}/100
                      </Typography>
                      <Typography
                        variant='caption'
                        component='div'
                        color='text.secondary'
                      >
                        {validationReport.score >= 80
                          ? "Excellent"
                          : validationReport.score >= 60
                            ? "Good"
                            : "Needs improvement"}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Performance recommendations */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.18 : 0.08),
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.6 : 0.35),
                }}
              >
                <Typography
                  variant='subtitle2'
                  component='div'
                  sx={{ mb: 1, fontWeight: "bold" }}
                >
                  🚀 Performance Recommendations
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 1 }}
                >
                  • Keep HTML size under 102KB for optimal email delivery
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 1 }}
                >
                  • Use inline styles instead of external CSS
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 1 }}
                >
                  • Optimize images and use appropriate dimensions
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 1 }}
                >
                  • Minimize table nesting for better rendering
                </Typography>
              </Box>
            </Box>
          )}

          {selectedTab === 3 && (
            <Box>
              <Typography
                variant='h6'
                component='div'
                sx={{
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 2,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.22 : 0.08),
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: (theme) =>
                    alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.6 : 0.35),
                  color: "success.main",
                  fontWeight: 600,
                  boxShadow: (theme) => theme.shadows[1],
                }}
              >
                <Settings color='primary' />
                Validation Settings
              </Typography>

              {/* Quick settings */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant='subtitle2'
                  component='div'
                  sx={{ mb: 2, fontWeight: "bold" }}
                >
                  Quick Actions
                </Typography>
                <Grid
                  container
                  spacing={2}
                >
                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Button
                      fullWidth
                      variant='contained'
                      startIcon={<AutoFixHigh />}
                      onClick={() => setShowSettings(true)}
                      sx={{
                        mb: 1,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 500,
                        boxShadow: (theme) => theme.shadows[2],
                        "&:hover": {
                          boxShadow: (theme) => theme.shadows[4],
                        },
                      }}
                    >
                      Advanced Settings
                    </Button>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={6}
                  >
                    <Button
                      fullWidth
                      variant='outlined'
                      startIcon={<FilterList />}
                      onClick={() => {
                        setFilterSeverity("all");
                        setFilterCategory("all");
                        setSearchQuery("");
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 500,
                        borderColor: "divider",
                        color: "text.secondary",
                        "&:hover": {
                          borderColor: "text.primary",
                          backgroundColor: "action.hover",
                        },
                      }}
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Current configuration summary */}
              <Box sx={{ p: 2, backgroundColor: "action.hover", borderRadius: 2 }}>
                <Typography
                  variant='subtitle2'
                  component='div'
                  sx={{ mb: 1, fontWeight: "bold" }}
                >
                  Current Configuration
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 0.5 }}
                >
                  • Severity Filter: {filterSeverity === "all" ? "All" : filterSeverity}
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 0.5 }}
                >
                  • Category Filter: {filterCategory === "all" ? "All" : filterCategory}
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ mb: 0.5 }}
                >
                  • Search Query: {searchQuery || "None"}
                </Typography>
                <Typography
                  variant='body2'
                  component='div'
                >
                  • Total Rules: {Object.keys(EMAIL_VALIDATION_RULES).length}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Settings Dialog */}
      <ValidationSettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        validator={validator}
      />
    </Paper>
  );
};

// Settings Dialog Component
interface ValidationSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  validator: EmailHTMLValidator;
}

const ValidationSettingsDialog: React.FC<ValidationSettingsDialogProps> = ({
  open,
  onClose,
  validator,
}) => {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = useMemo(() => getComponentStyles(mode, style), [mode, style]);

  const [config, setConfig] = useState(validator.getConfig());
  const availableRules = validator.getAvailableRules();

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${componentStyles.card.borderRadius}px`,
          background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.9),
          backdropFilter: componentStyles.card.backdropFilter,
          WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
          border: componentStyles.card.border,
          boxShadow: componentStyles.card.boxShadow,
        },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "background.default",
          borderBottom: "1px solid",
          borderBottomColor: "divider",
          fontWeight: 600,
        }}
      >
        Validation Settings
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant='h6'
            component='div'
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: (theme) =>
                alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.22 : 0.08),
              borderRadius: 2,
              border: "1px solid",
              borderColor: (theme) =>
                alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.6 : 0.35),
              color: "info.main",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <BugReport fontSize='small' />
            Validation Rules
          </Typography>
          <FormGroup>
            {Object.entries(availableRules).map(([ruleName, rule]) => (
              <FormControlLabel
                key={ruleName}
                control={
                  <Switch
                    checked={config.rules[ruleName]?.enabled ?? rule.enabled}
                    onChange={(e) => handleRuleToggle(ruleName, e.target.checked)}
                    color='primary'
                  />
                }
                label={
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor: "action.hover",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      flex: 1,
                    }}
                  >
                    <Typography
                      variant='body2'
                      component='div'
                      sx={{ fontWeight: 500 }}
                    >
                      {rule.displayName}
                    </Typography>
                    <Typography
                      variant='caption'
                      component='div'
                      color='text.secondary'
                    >
                      {rule.description}
                    </Typography>
                  </Box>
                }
                sx={{
                  alignItems: "flex-start",
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              />
            ))}
          </FormGroup>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography
            variant='h6'
            component='div'
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: (theme) =>
                alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.22 : 0.08),
              borderRadius: 2,
              border: "1px solid",
              borderColor: (theme) =>
                alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.6 : 0.35),
              color: "warning.main",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Computer fontSize='small' />
            Target Email Clients
          </Typography>
          <FormGroup>
            {Object.entries(config.targetClients).map(([client, enabled]) => (
              <FormControlLabel
                key={client}
                control={
                  <Switch
                    checked={enabled}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        targetClients: {
                          ...prev.targetClients,
                          [client]: e.target.checked,
                        },
                      }))
                    }
                    color='primary'
                  />
                }
                label={
                  <Box
                    sx={{
                      p: 1,
                      backgroundColor: "action.hover",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      flex: 1,
                    }}
                  >
                    <Typography
                      variant='body2'
                      component='div'
                      sx={{ fontWeight: 500 }}
                    >
                      {client.charAt(0).toUpperCase() + client.slice(1)}
                    </Typography>
                  </Box>
                }
                sx={{
                  alignItems: "flex-start",
                  mb: 1,
                  p: 1,
                  borderRadius: 1,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              />
            ))}
          </FormGroup>
        </Box>

        <Box
          sx={{
            p: 2,
            backgroundColor: (theme) =>
              alpha(theme.palette.secondary.main, theme.palette.mode === "dark" ? 0.22 : 0.08),
            borderRadius: 2,
            border: "1px solid",
            borderColor: (theme) =>
              alpha(theme.palette.secondary.main, theme.palette.mode === "dark" ? 0.6 : 0.35),
          }}
        >
          <Typography
            variant='h6'
            component='div'
            sx={{
              mb: 2,
              color: "secondary.main",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Settings fontSize='small' />
            Advanced Options
          </Typography>

          {/* HTML Size Limit */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant='body2'
              component='div'
              sx={{ mb: 1, fontWeight: 500 }}
            >
              Max HTML Size (KB)
            </Typography>
            <TextField
              type='number'
              size='small'
              value={Math.round(config.maxHtmlSize / 1024)}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setConfig((prev) => ({ ...prev, maxHtmlSize: value * 1024 }));
                }
              }}
              inputProps={{ min: 1, max: 1000 }}
              sx={{ width: 120 }}
              helperText={`Current: ${Math.round(config.maxHtmlSize / 1024)}KB`}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={config.strictMode}
                onChange={(e) => setConfig((prev) => ({ ...prev, strictMode: e.target.checked }))}
                color='secondary'
              />
            }
            label={
              <Box
                sx={{
                  p: 1,
                  backgroundColor: "action.hover",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  flex: 1,
                }}
              >
                <Typography
                  variant='body2'
                  component='div'
                  sx={{ fontWeight: 500 }}
                >
                  Strict Mode (treat warnings as errors)
                </Typography>
              </Box>
            }
            sx={{
              alignItems: "flex-start",
              p: 1,
              borderRadius: 1,
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: "1px solid", borderTopColor: "divider" }}>
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            px: 3,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant='contained'
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            px: 3,
            boxShadow: (theme) => theme.shadows[2],
            "&:hover": {
              boxShadow: (theme) => theme.shadows[4],
            },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailValidationPanel;
