import { useState } from "react";
import { motion } from "framer-motion";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

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

import { ImageFile } from "../types";
import { calculateCompressionRatio, formatFileSize } from "../utils/clientConverter";

interface ImageGridItemProps {
  file: ImageFile;
  onDownload: () => void;
  onRemove: () => void;
  onToggleSelection: () => void;
  index: number;
  dragListeners?: any; // Drag-and-drop listeners from @dnd-kit
}

export default function ImageGridItem({ file, onDownload, onRemove, onToggleSelection, index, dragListeners }: ImageGridItemProps) {
  const theme = useTheme();
  const [compareOpen, setCompareOpen] = useState(false);

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
        return <CircularProgress size={16} />;
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
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4, boxShadow: theme.shadows.hover }}
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.3s ease",
        borderRadius: theme.spacing(1.25), // 5px
      }}
    >
      {/* Selection Checkbox */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 10,
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
          sx={{
            color: "white",
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 1,
            p: 0.5,
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.7)",
            },
          }}
        />
      </Box>

      {/* Status Badge */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 50,
          zIndex: 2,
        }}
      >
        <Chip
          size='small'
          icon={getStatusIcon()}
          label={getStatusLabel()}
          color={getStatusColor()}
          sx={{ fontWeight: 500 }}
        />
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 2,
          display: "flex",
          gap: 0.5,
        }}
      >
        {file.status === "done" && (
          <>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Tooltip title='Download'>
                <IconButton
                  size='small'
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                  }}
                >
                  <DownloadIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Tooltip title='Compare Before/After'>
                <IconButton
                  size='small'
                  onClick={(e) => {
                    e.stopPropagation();
                    setCompareOpen(true);
                  }}
                  sx={{
                    backgroundColor: "rgba(255,255,255,0.9)",
                    "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
                  }}
                >
                  <CompareIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </motion.div>
          </>
        )}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Tooltip title='Remove'>
            <IconButton
              size='small'
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              sx={{
                backgroundColor: "rgba(255,255,255,0.9)",
                "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
              }}
            >
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Tooltip>
        </motion.div>
      </Box>

      {/* Image Preview */}
      <Box
        {...dragListeners}
        sx={{
          position: "relative",
          paddingTop: "100%", // Square aspect ratio
          backgroundColor: "#dedede",
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
            }}
          >
            <ImageIcon sx={{ fontSize: 64, color: "#ccc" }} />
          </Box>
        )}

        {/* Processing Overlay */}
        {file.status === "processing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress sx={{ color: "white" }} />
          </motion.div>
        )}
      </Box>

      {/* Progress Bar */}
      {file.status === "processing" && (
        <Box sx={{ width: "100%", position: "absolute", top: 185, bottom: 60 }}>
          <LinearProgress
            variant='determinate'
            value={file.progress || 0}
            sx={{
              height: 3,
              backgroundColor: "rgba(25, 118, 210, 0.1)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#1976d2",
                transition: "transform 0.3s ease",
              },
            }}
          />
        </Box>
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
                <span style={{ color: "#4caf50", fontWeight: 600 }}>
                  {formatFileSize(file.convertedSize)}
                </span>
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
                sx={{ height: 20, fontSize: "0.7rem", fontWeight: 600 }}
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
        maxWidth="lg"
        fullWidth
      >
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Typography variant="h6" gutterBottom>
            Before / After Comparison
          </Typography>
          <Box sx={{ height: 500, position: 'relative' }}>
            {file.previewUrl && file.convertedUrl && (
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={file.previewUrl}
                    alt="Original"
                    style={{ objectFit: 'contain' }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={file.convertedUrl}
                    alt="Converted"
                    style={{ objectFit: 'contain' }}
                  />
                }
                style={{
                  height: '100%',
                  width: '100%',
                }}
              />
            )}
          </Box>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Original: {formatFileSize(file.originalSize)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Converted: {file.convertedSize ? formatFileSize(file.convertedSize) : 'N/A'}
            </Typography>
            <Typography variant="body2" color="success.main">
              Saved: {compression}%
            </Typography>
          </Box>
        </Box>
      </Dialog>
    </Card>
  );
}
