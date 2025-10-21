import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useRef, useState } from 'react';

import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { Box, Button, Grid, Typography } from '@mui/material';

import { MAX_FILE_SIZE_CLIENT, MAX_FILE_SIZE_SERVER } from '../constants';
import { useImageConverter } from '../context/ImageConverterContext';
import { validateImageFiles } from '../utils/validators';

import ImageGridItem from './ImageGridItem';

export default function FileUploadZone() {
  const { addFiles, settings, files, removeFile, downloadFile } = useImageConverter();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFileSize = settings.processingMode === 'client' ? MAX_FILE_SIZE_CLIENT : MAX_FILE_SIZE_SERVER;
  const hasFiles = files.length > 0;

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      const { validFiles, errors } = validateImageFiles(files, maxFileSize);

      if (errors.length > 0) {
        setError(errors.join(', '));
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

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addFiles, validateFiles]
  );

  const handleBrowseClick = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  return (
    <Box>
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={{
          border: isDragging ? '3px dashed #1976d2' : '2px dashed #ccc',
          boxShadow: isDragging ? '0 0 10px 0 rgba(25, 118, 210, 0.5)' : 'none',
          borderRadius: 5,
          padding: 3,
          backgroundColor: isDragging ? '#e3f2fd' : '#fafafa',
          cursor: hasFiles ? 'default' : 'pointer',
          transition: 'all 0.3s ease',
          minHeight: hasFiles ? 300 : 200,
          position: 'relative',
          '&:hover': {
            borderColor: '#1976d2',
            backgroundColor: hasFiles ? '#fafafa' : '#f5f5f5',
          },
        }}
        onClick={!hasFiles ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />

        {/* Empty State - shows only when there are no files */}
        {!hasFiles && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
            <UploadIcon sx={{ fontSize: 64, color: isDragging ? '#1976d2' : '#bbb', mb: 1 }} />
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Drag & drop images here
            </Typography>
            <Button variant="contained" onClick={handleBrowseClick} sx={{ mb: 2 }}>
              Browse Files
            </Button>
            <Typography variant="caption" display="block" color="text.secondary">
              Supports: PNG, JPG, JPEG, WebP
              <br />
              Max size: {maxFileSize / (1024 * 1024)}MB ({settings.processingMode} mode)
            </Typography>
          </motion.div>
        )}

        {/* Grid with Images - shows when there are files */}
        {hasFiles && (
          <Box>
            {/* Compact header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {files.length} {files.length === 1 ? 'image' : 'images'}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={handleBrowseClick}
                sx={{ textTransform: 'none' }}
              >
                Add More
              </Button>
            </Box>

            {/* Image Grid */}
            <Grid container spacing={2}>
              <AnimatePresence mode="popLayout">
                {files.map((file, index) => (
                  <Grid item xs={6} sm={4} md={3} key={file.id}>
                    <ImageGridItem
                      file={file}
                      onDownload={() => downloadFile(file.id)}
                      onRemove={() => removeFile(file.id)}
                      index={index}
                    />
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
          </Box>
        )}

        {/* Drop Overlay - shows when dragging over existing files */}
        {isDragging && hasFiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(25, 118, 210, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Box textAlign="center">
              <UploadIcon sx={{ fontSize: 64, color: '#1976d2' }} />
              <Typography variant="h6" color="primary">
                Drop to add more images
              </Typography>
            </Box>
          </motion.div>
        )}
      </Box>

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
