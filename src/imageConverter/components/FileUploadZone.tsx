import { motion } from "framer-motion";
import React, { useCallback, useRef, useState } from "react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import { CloudUpload as UploadIcon, Add as AddIcon } from "@mui/icons-material";
import { alpha, Box, Button, Grid, Typography, useTheme } from "@mui/material";

import { useThemeMode } from "../../theme";
import { getComponentStyles } from "../../theme/componentStyles";
import { MAX_FILE_SIZE_CLIENT, MAX_FILE_SIZE_SERVER } from "../constants";
import { useImageConverter } from "../context/ImageConverterContext";
import { validateImageFiles } from "../utils/validators";

import BulkActions from "./BulkActions";
import SortableImageItem from "./SortableImageItem";

export default function FileUploadZone() {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);
  const { addFiles, settings, files, removeFile, downloadFile, reorderFiles, toggleSelection } =
    useImageConverter();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderFiles(oldIndex, newIndex);
      }
    }
  };

  const maxFileSize =
    settings.processingMode === "client" ? MAX_FILE_SIZE_CLIENT : MAX_FILE_SIZE_SERVER;
  const hasFiles = files.length > 0;

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      const { validFiles, errors } = validateImageFiles(files, maxFileSize);

      if (errors.length > 0) {
        setError(errors.join(", "));
        setTimeout(() => setError(null), 5000);
      }

      return validFiles;
    },
    [maxFileSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(droppedFiles);

      if (validFiles.length > 0) {
        addFiles(validFiles);
      }
    },
    [addFiles, validateFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const validFiles = validateFiles(selectedFiles);

      if (validFiles.length > 0) {
        addFiles(validFiles);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addFiles, validateFiles]
  );

  const handleBrowseClick = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* Drop Zone */}
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!hasFiles ? handleBrowseClick : undefined}
        sx={{
          flex: 1,
          border: isDragging
            ? `3px dashed ${theme.palette.primary.main}`
            : componentStyles.card.border,
          boxShadow: isDragging
            ? `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`
            : componentStyles.card.boxShadow,
          borderRadius: componentStyles.card.borderRadius,
          backgroundColor: isDragging
            ? alpha(theme.palette.primary.main, 0.06)
            : componentStyles.card.background || theme.palette.background.paper,
          backdropFilter: componentStyles.card.backdropFilter,
          WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
          cursor: hasFiles ? "default" : "pointer",
          transition: "all 0.25s ease",
          minHeight: hasFiles ? 400 : 300,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          "&:hover": {
            borderColor: hasFiles ? theme.palette.divider : theme.palette.primary.main,
            backgroundColor: hasFiles
              ? componentStyles.card.background || theme.palette.background.paper
              : alpha(theme.palette.primary.main, 0.02),
            boxShadow: componentStyles.card.hover?.boxShadow || componentStyles.card.boxShadow,
          },
        }}
      >
        {/* Empty State */}
        {!hasFiles && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: theme.spacing(4),
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <UploadIcon
                sx={{
                  fontSize: 40,
                  color: isDragging ? theme.palette.primary.main : theme.palette.text.secondary,
                  transition: "color 0.2s",
                }}
              />
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom>
              Drop images here
            </Typography>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              or click to browse your files
            </Typography>

            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleBrowseClick}
              sx={{ textTransform: "none", px: 4 }}
            >
              Browse Files
            </Button>

            <Typography variant="caption" color="text.disabled" sx={{ mt: 3 }}>
              Supports: PNG, JPG, JPEG, WebP • Max: {maxFileSize / (1024 * 1024)}MB
            </Typography>
          </motion.div>
        )}

        {/* Files Grid */}
        {hasFiles && (
          <Box sx={{ flex: 1, p: 2, overflow: "auto" }}>
            {/* Header with count and add button */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {files.length} {files.length === 1 ? "image" : "images"}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleBrowseClick}
                sx={{ textTransform: "none" }}
              >
                Add More
              </Button>
            </Box>

            {/* Bulk Actions */}
            <BulkActions />

            {/* Image Grid with Drag & Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={files.map((f) => f.id)} strategy={rectSortingStrategy}>
                <Grid container spacing={2}>
                  {files.map((file, index) => (
                    <SortableImageItem
                      key={file.id}
                      file={file}
                      index={index}
                      onDownload={() => downloadFile(file.id)}
                      onRemove={() => removeFile(file.id)}
                      onToggleSelection={() => toggleSelection(file.id)}
                    />
                  ))}
                </Grid>
              </SortableContext>
            </DndContext>
          </Box>
        )}

        {/* Drop Overlay */}
        {isDragging && hasFiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
              backdropFilter: "blur(4px)",
              borderRadius: theme.spacing(1.5),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <Box
              sx={{
                textAlign: "center",
                p: 4,
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
              }}
            >
              <UploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h6" color="primary" fontWeight={600}>
                Drop to add more images
              </Typography>
            </Box>
          </motion.div>
        )}
      </Box>

      {/* Error Message */}
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
