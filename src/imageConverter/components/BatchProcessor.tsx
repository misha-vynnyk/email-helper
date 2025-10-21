import { motion } from 'framer-motion';
import React from 'react';

import { Download as DownloadIcon } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';

import { useImageConverter } from '../context/ImageConverterContext';
import { useImageStats } from '../hooks/useImageStats';
import { formatFileSize } from '../utils/clientConverter';

export default function BatchProcessor() {
  const { files, settings, clearFiles, downloadAll, convertAll } = useImageConverter();
  const stats = useImageStats(files);

  if (files.length === 0) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Paper elevation={2} sx={{ p: 2, borderRadius: 5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" >
          {/* Stats */}
          <Box>
            {stats.completed > 0 && (
              <Typography variant="body2" color="text.secondary">
                <strong>{stats.completed}</strong> / {stats.total} converted •
                <span style={{ color: '#4caf50', fontWeight: 600, marginLeft: 4 }}>
                  {formatFileSize(stats.savedSize)} saved ({stats.savedPercent}%)
                </span>
              </Typography>
            )}
            {stats.completed === 0 && (
              <Typography variant="body2" color="text.secondary">
                Ready to convert {stats.total} {stats.total === 1 ? 'image' : 'images'}
              </Typography>
            )}
          </Box>

          {/* Actions */}
          <Box display="flex" gap={1}>
            {!settings.autoConvert && stats.total > stats.completed && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  onClick={convertAll}
                  disabled={stats.processing > 0}
                  sx={{ textTransform: 'none' }}
                >
                  Convert All
                </Button>
              </motion.div>
            )}
            {stats.completed > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadAll}
                  sx={{ textTransform: 'none' }}
                >
                  Download All
                </Button>
              </motion.div>
            )}
            {stats.total > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outlined" color="error" onClick={clearFiles} sx={{ textTransform: 'none' }}>
                  Clear All
                </Button>
              </motion.div>
            )}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}
