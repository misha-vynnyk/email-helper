import { useState } from "react";
import { motion } from "framer-motion";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";

import {
  CheckBox as CheckedIcon,
  CheckBoxOutlineBlank as UncheckedIcon,
  CheckCircle as DoneIcon,
  CompareArrows as CompareIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Card,
  CardMedia,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { ImageFile } from "../types";
import { calculateCompressionRatio, formatFileSize } from "../utils/clientConverter";

interface ImageGridItemProps {
  file: ImageFile;
  onDownload: () => void;
  onRemove: () => void;
  onToggleSelection: () => void;
  index: number;
  dragListeners?: any;
}

export default function ImageGridItem({
  file,
  onDownload,
  onRemove,
  onToggleSelection,
  index,
  dragListeners,
}: ImageGridItemProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const dialogPaperSx = {
    borderRadius: `${componentStyles.card.borderRadius}px`,
    background: componentStyles.card.background || alpha(theme.palette.background.paper, 0.92),
    backdropFilter: componentStyles.card.backdropFilter,
    WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
    border: componentStyles.card.border,
    boxShadow: componentStyles.card.boxShadow,
  } as const;
  const [compareOpen, setCompareOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const compression =
    file.convertedSize && file.status === "done"
      ? calculateCompressionRatio(file.originalSize, file.convertedSize)
      : 0;

  const getStatusColor = () => {
    switch (file.status) {
      case "done":
        return "success";
      case "processing":
        return "primary";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case "done":
        return <DoneIcon fontSize='small' />;
      case "processing":
        return (
          <CircularProgress
            size={14}
            color='inherit'
          />
        );
      case "error":
        return <ErrorIcon fontSize='small' />;
      default:
        return <PendingIcon fontSize='small' />;
    }
  };

  const getStatusLabel = () => {
    switch (file.status) {
      case "done":
        return "Done";
      case "processing":
        return "Converting...";
      case "error":
        return "Error";
      default:
        return "Pending";
    }
  };

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: "pointer",
        borderRadius: componentStyles.card.borderRadius,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backgroundColor: componentStyles.card.background || theme.palette.background.paper,
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: file.selected
          ? `1px solid ${alpha(theme.palette.primary.main, 0.4)}`
          : componentStyles.card.border,
        boxShadow: componentStyles.card.boxShadow,
        "&:hover": {
          transform: componentStyles.card.hover?.transform || "translateY(-2px)",
          boxShadow: componentStyles.card.hover?.boxShadow || theme.shadows[4],
          border: file.selected
            ? `1px solid ${alpha(theme.palette.primary.main, 0.6)}`
            : componentStyles.card.hover?.border || componentStyles.card.border,
        },
      }}
    >
      {/* Selection Checkbox - Always visible */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 3,
        }}
      >
        <Checkbox
          checked={file.selected || false}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection();
          }}
          icon={<UncheckedIcon />}
          checkedIcon={<CheckedIcon />}
          size='small'
          sx={{
            color: theme.palette.common.white,
            backgroundColor: alpha(theme.palette.common.black, 0.4),
            borderRadius: 1,
            p: 0.25,
            "&:hover": {
              backgroundColor: alpha(theme.palette.common.black, 0.6),
            },
            "&.Mui-checked": {
              color: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.common.white, 0.9),
            },
          }}
        />
      </Box>

      {/* Status Badge */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 44,
          zIndex: 2,
        }}
      >
        <Chip
          size='small'
          icon={getStatusIcon()}
          label={getStatusLabel()}
          color={getStatusColor()}
          sx={{
            fontWeight: 500,
            height: 24,
            fontSize: "0.7rem",
            "& .MuiChip-icon": {
              fontSize: "0.9rem",
            },
          }}
        />
      </Box>

      {/* Action Buttons - Show on hover */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 2,
          display: "flex",
          gap: 0.5,
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? "translateX(0)" : "translateX(10px)",
          transition: "all 0.2s ease",
        }}
      >
        {file.status === "done" && (
          <>
            <Tooltip title='Download'>
              <IconButton
                size='small'
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  backdropFilter: "blur(8px)",
                  borderRadius: "50%",
                  boxShadow: theme.shadows[2],
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  "&:hover": {
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.success.main,
                    boxShadow: theme.shadows[4],
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <DownloadIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Compare Before/After'>
              <IconButton
                size='small'
                onClick={(e) => {
                  e.stopPropagation();
                  setCompareOpen(true);
                }}
                sx={{
                  width: 32,
                  height: 32,
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  backdropFilter: "blur(8px)",
                  borderRadius: "50%",
                  boxShadow: theme.shadows[2],
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  "&:hover": {
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.info.main,
                    boxShadow: theme.shadows[4],
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                <CompareIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title='Remove'>
          <IconButton
            size='small'
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            sx={{
              width: 32,
              height: 32,
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: "blur(8px)",
              borderRadius: "50%",
              boxShadow: theme.shadows[2],
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              "&:hover": {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.error.main,
                boxShadow: theme.shadows[4],
                transform: "scale(1.1)",
              },
              transition: "all 0.2s ease",
            }}
          >
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Image Preview */}
      <Box
        {...dragListeners}
        sx={{
          position: "relative",
          paddingTop: "100%",
          backgroundColor: theme.palette.grey[200],
          overflow: "hidden",
          cursor: dragListeners ? "grab" : "default",
          "&:active": {
            cursor: dragListeners ? "grabbing" : "default",
          },
        }}
      >
        {file.previewUrl ? (
          <CardMedia
            component='img'
            image={file.previewUrl}
            alt={file.file.name}
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ImageIcon sx={{ fontSize: 48, color: theme.palette.grey[400] }} />
          </Box>
        )}

        {/* Processing Overlay */}
        {file.status === "processing" && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: alpha(theme.palette.common.black, 0.5),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress sx={{ color: theme.palette.common.white }} />
          </Box>
        )}
      </Box>

      {/* Progress Bar */}
      {file.status === "processing" && (
        <LinearProgress
          variant='determinate'
          value={file.progress || 0}
          sx={{
            height: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            "& .MuiLinearProgress-bar": {
              backgroundColor: theme.palette.primary.main,
            },
          }}
        />
      )}

      {/* File Info */}
      <Box sx={{ p: 1.5, flexGrow: 1 }}>
        <Typography
          variant='body2'
          fontWeight={500}
          noWrap
          sx={{ mb: 0.5 }}
          title={file.file.name}
        >
          {file.file.name}
        </Typography>

        <Box
          display='flex'
          flexDirection='column'
          gap={0.5}
        >
          <Typography
            variant='caption'
            color='text.secondary'
          >
            {formatFileSize(file.originalSize)}
            {file.convertedSize && (
              <>
                {" → "}
                <Box
                  component='span'
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  {formatFileSize(file.convertedSize)}
                </Box>
              </>
            )}
          </Typography>

          {compression > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Chip
                size='small'
                label={`-${compression}% saved`}
                color='success'
                sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600 }}
              />
            </motion.div>
          )}

          {file.error && (
            <Typography
              variant='caption'
              color='error'
              sx={{ mt: 0.5 }}
            >
              {file.error}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Comparison Dialog */}
      <Dialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        maxWidth='lg'
        fullWidth
        PaperProps={{ sx: dialogPaperSx }}
      >
        <Box sx={{ p: 2 }}>
          <Typography
            variant='h6'
            gutterBottom
          >
            Before / After Comparison
          </Typography>
          <Box sx={{ height: 500, position: "relative" }}>
            {file.previewUrl && file.convertedUrl && (
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={file.previewUrl}
                    alt='Original'
                    style={{ objectFit: "contain" }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={file.convertedUrl}
                    alt='Converted'
                    style={{ objectFit: "contain" }}
                  />
                }
                style={{
                  height: "100%",
                  width: "100%",
                }}
              />
            )}
          </Box>
          <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
            <Typography
              variant='body2'
              color='text.secondary'
            >
              Original: {formatFileSize(file.originalSize)}
            </Typography>
            <Typography
              variant='body2'
              color='text.secondary'
            >
              Converted: {file.convertedSize ? formatFileSize(file.convertedSize) : "N/A"}
            </Typography>
            <Typography
              variant='body2'
              color='success.main'
              fontWeight={600}
            >
              Saved: {compression}%
            </Typography>
          </Box>
        </Box>
      </Dialog>
    </Card>
  );
}
