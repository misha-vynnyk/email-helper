/**
 * Dimension Optimizer Component
 * Smart dimension suggestions based on image analysis
 */

import React, { useState } from 'react';

import { AutoFixHigh as OptimizeIcon, ContentCopy as CopyIcon } from '@mui/icons-material';

import { logger } from '../../utils/logger';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { useImageConverter } from '../context/ImageConverterContext';
import { analyzeImageDimensions, DimensionSuggestion, generateDimensionSuggestions, ImageAnalysis } from '../utils/dimensionOptimizer';

export default function DimensionOptimizer() {
  const { files, updateSettings } = useImageConverter();
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<DimensionSuggestion[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (files.length === 0) {
      alert('Please upload at least one image first');
      return;
    }

    setAnalyzing(true);
    setOpen(true);

    try {
      // Analyze first image
      const firstFile = files[0].file;
      const imageAnalysis = await analyzeImageDimensions(firstFile);
      const dimensionSuggestions = generateDimensionSuggestions(imageAnalysis);

      setAnalysis(imageAnalysis);
      setSuggestions(dimensionSuggestions);
    } catch (error) {
      logger.error('DimensionOptimizer', 'Failed to analyze image', error);
      alert('Failed to analyze image');
      setOpen(false);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplySuggestion = (suggestion: DimensionSuggestion) => {
    updateSettings({
      resize: {
        mode: 'custom',
        width: suggestion.width,
        height: suggestion.height,
        preserveAspectRatio: true,
      },
    });
    setOpen(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'thumbnail':
        return 'secondary';
      case 'email':
        return 'primary';
      case 'web':
        return 'success';
      case 'print':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Tooltip title="Analyze and suggest optimal dimensions">
        <Button
          variant="outlined"
          size="small"
          startIcon={<OptimizeIcon />}
          onClick={handleAnalyze}
          disabled={files.length === 0}
          sx={{ textTransform: 'none' }}
        >
          Smart Dimensions
        </Button>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <OptimizeIcon />
            <Typography variant="h6">Dimension Optimizer</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {analyzing && (
            <Typography variant="body2" color="text.secondary">
              Analyzing image dimensions...
            </Typography>
          )}

          {analysis && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Image Analysis
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label={`${analysis.originalWidth}x${analysis.originalHeight}px`}
                  size="small"
                  variant="outlined"
                />
                <Chip label={analysis.orientation} size="small" color="primary" variant="outlined" />
                <Chip
                  label={`${(analysis.pixelCount / 1000000).toFixed(1)}MP`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`Ratio ${analysis.aspectRatio.toFixed(2)}:1`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>
          )}

          {suggestions.length > 0 && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">Recommended Dimensions</Typography>
              {suggestions.map((suggestion, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Chip
                            label={suggestion.category.toUpperCase()}
                            size="small"
                            color={getCategoryColor(suggestion.category) as any}
                          />
                          {suggestion.estimatedSize && (
                            <Typography variant="caption" color="text.secondary">
                              {suggestion.estimatedSize}
                            </Typography>
                          )}
                        </Box>
                        <Typography variant="body1" fontWeight={500}>
                          {suggestion.width} x {suggestion.height} px
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {suggestion.reason}
                        </Typography>
                      </Box>
                      <Box>
                        <Tooltip title="Copy dimensions">
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${suggestion.width}x${suggestion.height}`
                              );
                            }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleApplySuggestion(suggestion)}
                          sx={{ ml: 1 }}
                        >
                          Apply
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
