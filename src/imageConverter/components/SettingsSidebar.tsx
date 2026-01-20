import React, { useState } from "react";

import {
  DeleteOutline,
  Speed as SpeedIcon,
  Image as ImageIcon,
  Visibility as PreviewIcon,
  Tune as AdvancedIcon,
  Build as ToolsIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  alpha,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { borderRadius, opacity, spacing, spacingMUI } from "../../theme/tokens";
import { useImageConverter } from "../context/ImageConverterContext";
import AnimatedBackground from "./AnimatedBackground";
import { imageCache } from "../utils/imageCache";

import AdvancedSettingsSection from "./AdvancedSettingsSection";
import AutoConvertToggle from "./AutoConvertToggle";
import CompressionModeSelector from "./CompressionModeSelector";
import EstimatedSizeIndicator from "./EstimatedSizeIndicator";
import FormatTabsSelector from "./FormatTabsSelector";
import ProcessingModeToggle from "./ProcessingModeToggle";
import QualityControl from "./QualityControl";

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: spacingMUI.md, mb: spacingMUI.base }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 36,
          height: 36,
          borderRadius: componentStyles.card.borderRadius,
          bgcolor: alpha(theme.palette.primary.main, opacity.selected),
          color: "primary.main",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant='subtitle2' fontWeight={600}>
          {title}
        </Typography>
        {subtitle && <Typography variant='caption' color='text.secondary'>{subtitle}</Typography>}
      </Box>
    </Box>
  );
}

interface SettingsSectionProps {
  children: React.ReactNode;
  dense?: boolean;
}

function SettingsSection({ children, dense = false }: SettingsSectionProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  return (
    <Paper
      elevation={0}
      sx={{
        p: dense ? 1.5 : 2,
        borderRadius: componentStyles.card.borderRadius,
        backgroundColor:
          componentStyles.card.background || alpha(theme.palette.background.paper, 0.8),
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: componentStyles.card.border,
        boxShadow: componentStyles.card.boxShadow,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          boxShadow: componentStyles.card.hover?.boxShadow || componentStyles.card.boxShadow,
        },
      }}
    >
      {children}
    </Paper>
  );
}

export default function SettingsSidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const { settings, updateSettings, files } = useImageConverter();
  const [cacheStats, setCacheStats] = React.useState<{
    count: number;
    sizeFormatted: string;
  } | null>(null);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);

  // Load cache stats on mount
  React.useEffect(() => {
    imageCache.getStats().then(setCacheStats);
  }, []);

  const handleClearCache = async () => {
    await imageCache.clear();
    setCacheStats({ count: 0, sizeFormatted: "0 B" });
  };

  // Get selected file for estimation
  const selectedFilesIds = files
    .filter((f) => f.selected)
    .map((f) => f.id)
    .join(",");

  const { originalSize, originalFormat, isMultipleSelected, hasSelection } = React.useMemo(() => {
    const selectedFiles = files.filter((f) => f.selected);

    if (selectedFiles.length === 0) {
      return {
        originalSize: 0,
        originalFormat: "",
        isMultipleSelected: false,
        hasSelection: false,
      };
    }

    if (selectedFiles.length > 1) {
      return { originalSize: 0, originalFormat: "", isMultipleSelected: true, hasSelection: true };
    }

    const selectedFile = selectedFiles[0];
    return {
      originalSize: selectedFile.originalSize || 0,
      originalFormat: selectedFile.file?.type || "",
      isMultipleSelected: false,
      hasSelection: true,
    };
  }, [files, selectedFilesIds]);

  // Common accordion styles
  const accordionStyles = {
    borderRadius: componentStyles.card.borderRadius,
    bgcolor: componentStyles.card.background || "background.paper",
    backdropFilter: componentStyles.card.backdropFilter,
    WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
    border: componentStyles.card.border,
    boxShadow: componentStyles.card.boxShadow,
    "&:before": { display: "none" },
    "&.Mui-expanded": { m: 0 },
    "&:hover": { bgcolor: "action.hover" },
  };

  const accordionSummaryStyles = {
    px: spacingMUI.base,
    py: spacingMUI.md,
    minHeight: 48,
    "&.Mui-expanded": { minHeight: 48 },
    "& .MuiAccordionSummary-content": { m: 0, "&.Mui-expanded": { m: 0 } },
  };

  const iconBoxStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    bgcolor: alpha(theme.palette.primary.main, opacity.selected),
    color: "primary.main",
  };

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        borderRight: isMobile ? "none" : 1,
        borderColor: "divider",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Animated Background - only for non-default styles */}
      {style !== "default" && <AnimatedBackground />}

      {/* Scrollable Content */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          // overflowX: "hidden", // Прибрано щоб не обрізати borderRadius останнього акордіона
          // position: "relative",
          zIndex: 1,
          p: spacingMUI.lg,
          display: "flex",
          flexDirection: "column",
          gap: spacingMUI.lg,
          "&::-webkit-scrollbar": { width: spacing.sm },
          "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: alpha(theme.palette.text.secondary, opacity.background.medium),
            borderRadius: borderRadius.sm,
            "&:hover": { bgcolor: alpha(theme.palette.text.secondary, opacity.background.light) },
          },
        }}
        data-app-scroll='true'
      >
        {/* Section 1: Mode - Always Expanded */}
        <Box sx={{ display: "flex", gap: spacingMUI.md }}>
          <SectionHeader icon={<SpeedIcon fontSize='small' />} title='Mode' />
          <Stack spacing={spacingMUI.md}>
            <AutoConvertToggle />
            <ProcessingModeToggle />
          </Stack>
        </Box>

        {/* Section 2: Output Settings - Always Expanded */}
        <Box>
          <SectionHeader icon={<ImageIcon fontSize='small' />} title='Output Settings' />
          <Stack spacing={spacingMUI.md}>
            {!settings.preserveFormat && (
              <SettingsSection>
                <FormatTabsSelector value={settings.format} onChange={(format) => updateSettings({ format })} />
              </SettingsSection>
            )}
            <SettingsSection dense>
              <FormControlLabel
                control={
                  <Checkbox checked={settings.preserveFormat} onChange={(e) => updateSettings({ preserveFormat: e.target.checked })} size='small' />
                }
                label={<Typography variant='body2' fontWeight={500}>Preserve original format</Typography>}
                sx={{ m: 0 }}
              />
            </SettingsSection>
            <SettingsSection>
              <CompressionModeSelector />
            </SettingsSection>
            <SettingsSection>
              <QualityControl
                autoQuality={settings.autoQuality}
                quality={settings.quality}
                compressionMode={settings.compressionMode}
                onAutoQualityChange={(auto) => updateSettings({ autoQuality: auto })}
                onQualityChange={(quality) => updateSettings({ quality })}
              />
            </SettingsSection>
          </Stack>
        </Box>

        {/* Section 3: Preview - Always Expanded (when has selection) */}
        {hasSelection && (
          <>
            <SectionHeader icon={<PreviewIcon fontSize='small' />} title='Preview' subtitle='Estimated output size' />
            <EstimatedSizeIndicator
              originalSize={originalSize}
              originalFormat={originalFormat}
              settings={settings}
              disabled={isMultipleSelected}
            />
          </>
        )}

        {/* Section 4: Advanced Settings - Collapsible */}
        <Accordion expanded={advancedExpanded} onChange={(_, expanded) => setAdvancedExpanded(expanded)} disableGutters sx={accordionStyles}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />} sx={accordionSummaryStyles}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={iconBoxStyles}>
                <AdvancedIcon fontSize='small' />
              </Box>
              <Box>
                <Typography variant='subtitle2' fontWeight={600}>Advanced</Typography>
                <Typography variant='caption' color='text.secondary'>Resize, metadata & more</Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: spacingMUI.base, pb: spacingMUI.base, pt: 0 }}>
            <AdvancedSettingsSection settings={settings} updateSettings={updateSettings} />
          </AccordionDetails>
        </Accordion>

        {/* Section 5: Tools - Collapsible */}
        <Accordion expanded={toolsExpanded} onChange={(_, expanded) => setToolsExpanded(expanded)} disableGutters sx={accordionStyles}>
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "text.secondary" }} />} sx={accordionSummaryStyles}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={iconBoxStyles}>
                <ToolsIcon fontSize='small' />
              </Box>
              <Box>
                <Typography variant='subtitle2' fontWeight={600}>Tools</Typography>
                <Typography variant='caption' color='text.secondary'>Cache Management</Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ px: spacingMUI.base, pb: spacingMUI.base, pt: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant='body2' color='text.secondary'>
                {cacheStats ? `${cacheStats.count} items (${cacheStats.sizeFormatted})` : "Loading..."}
              </Typography>
              <Tooltip title='Clear all cached conversions' arrow>
                <span>
                  <Button
                    variant='outlined'
                    size='small'
                    color='warning'
                    startIcon={<DeleteOutline />}
                    onClick={handleClearCache}
                    disabled={!cacheStats || cacheStats.count === 0}
                    sx={{ textTransform: "none" }}
                  >
                    Clear
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}
