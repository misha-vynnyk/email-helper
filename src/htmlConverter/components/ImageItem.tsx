import { Box, Chip, IconButton, LinearProgress, Stack, ToggleButton, ToggleButtonGroup, Tooltip, useTheme, alpha } from "@mui/material";
import { Close as CloseIcon, Download as DownloadIcon } from "@mui/icons-material";
import { borderRadius } from "../../theme/tokens";
import { ProcessedImage, ImageFormat, ImageFormatOverride } from "../types";
import { getImageFormat } from "../imageUtils";

interface ImageItemProps {
  image: ProcessedImage;
  globalFormat: ImageFormat;
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
  onFormatChange: (id: string, format: ImageFormatOverride) => void;
}

export function ImageItem({ image, globalFormat, onDownload, onRemove, onFormatChange }: ImageItemProps) {
  const theme = useTheme();
  const imgFormat = getImageFormat(image, globalFormat);

  // Distinct colors by output format
  const badgeBg = imgFormat === "png" ? theme.palette.success.main : theme.palette.warning.dark;

  return (
    <Stack spacing={0.5} alignItems='center'>
      <Box
        sx={{
          position: "relative",
          minWidth: 80,
          maxWidth: 80,
          height: 80,
          borderRadius: `${borderRadius.sm}px`,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
        }}>
        <img
          src={image.previewUrl}
          alt={image.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Format Badge */}
        <Chip
          label={imgFormat.toUpperCase()}
          size='small'
          sx={{
            position: "absolute",
            top: 2,
            right: 2,
            height: 16,
            fontSize: "0.65rem",
            fontWeight: 700,
            backgroundColor: badgeBg,
            color: "white",
            border: "1px solid rgba(255,255,255,0.4)",
            "& .MuiChip-label": { px: 0.5 },
          }}
        />
        {image.status === "processing" && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.background.default, 0.8),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <LinearProgress sx={{ width: "80%" }} />
          </Box>
        )}
        {image.status === "done" && (
          <Tooltip title='Завантажити'>
            <IconButton
              size='small'
              onClick={() => onDownload(image.id)}
              sx={{
                position: "absolute",
                bottom: 2,
                right: 2,
                backgroundColor: alpha(theme.palette.success.main, 0.9),
                color: "white",
                width: 20,
                height: 20,
                "&:hover": {
                  backgroundColor: theme.palette.success.main,
                },
              }}>
              <DownloadIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title='Видалити'>
          <IconButton
            size='small'
            onClick={() => onRemove(image.id)}
            sx={{
              position: "absolute",
              bottom: 2,
              left: 2,
              backgroundColor: alpha(theme.palette.error.main, 0.8),
              color: "white",
              width: 20,
              height: 20,
              "&:hover": {
                backgroundColor: theme.palette.error.main,
              },
            }}>
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Format Selector */}
      <ToggleButtonGroup
        value={image.formatOverride || "auto"}
        exclusive
        onChange={(_, val) => val && onFormatChange(image.id, val as ImageFormatOverride)}
        size='small'
        sx={{
          height: 20,
          "& .MuiToggleButton-root": {
            fontSize: "0.65rem",
            px: 0.5,
            py: 0.25,
            minWidth: 28,
            lineHeight: 1,
            border: `1px solid ${theme.palette.divider}`,
          },
        }}>
        <ToggleButton value='auto'>
          <Tooltip title='Авто (прозорість → PNG)'>
            <span>Auto</span>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value='jpeg'>JPG</ToggleButton>
        <ToggleButton value='png'>PNG</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}
