import { AutoMode as AutoIcon, PanTool as ManualIcon } from "@mui/icons-material";
import { Box, FormControlLabel, Switch, Typography, alpha, useTheme } from "@mui/material";

import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { useImageConverter } from "../context/ImageConverterContext";

export default function AutoConvertToggle() {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const { settings, updateSettings } = useImageConverter();

  return (
    <Box
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: componentStyles.card.borderRadius,
        backgroundColor: settings.autoConvert
          ? alpha(theme.palette.primary.main, 0.08)
          : componentStyles.card.background || alpha(theme.palette.grey[500], 0.08),
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: componentStyles.card.border,
        boxShadow: componentStyles.card.boxShadow,
        transition: "all 0.2s ease",
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={settings.autoConvert}
            onChange={(e) => updateSettings({ autoConvert: e.target.checked })}
            color="primary"
            size="small"
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={1}>
            {settings.autoConvert ? (
              <AutoIcon fontSize="small" color="primary" />
            ) : (
              <ManualIcon fontSize="small" color="action" />
            )}
            <Typography variant="body2" fontWeight={500}>
              {settings.autoConvert ? "Auto-Convert" : "Manual Mode"}
            </Typography>
          </Box>
        }
        sx={{ m: 0 }}
      />
    </Box>
  );
}
