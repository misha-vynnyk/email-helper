import { motion } from "framer-motion";

import {
  Download as DownloadIcon,
  DeleteSweep as ClearIcon,
  PlayArrow as ConvertIcon,
} from "@mui/icons-material";
import { Box, Button, Chip, Typography, useTheme } from "@mui/material";

import { useImageConverter } from "../context/ImageConverterContext";
import { useImageStats } from "../hooks/useImageStats";
import { formatFileSize } from "../utils/clientConverter";

export default function BatchProcessor() {
  const theme = useTheme();
  const { files, settings, clearFiles, downloadAll, convertAll } = useImageConverter();
  const stats = useImageStats(files);

  if (files.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 2,
        gap: 2,
      }}
    >
      {/* Stats Section */}
      <Box display="flex" alignItems="center" gap={2}>
        {stats.completed > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary">
              <strong>{stats.completed}</strong> / {stats.total} converted
            </Typography>
            <Chip
              size="small"
              color="success"
              label={`${formatFileSize(stats.savedSize)} saved (${stats.savedPercent}%)`}
              sx={{ fontWeight: 600 }}
            />
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {stats.processing > 0 ? (
              <>Processing {stats.processing} {stats.processing === 1 ? "image" : "images"}...</>
            ) : (
              <>Ready to convert {stats.total} {stats.total === 1 ? "image" : "images"}</>
            )}
          </Typography>
        )}
      </Box>

      {/* Actions Section */}
      <Box display="flex" gap={1}>
        {/* Convert All Button */}
        {!settings.autoConvert && stats.total > stats.completed && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<ConvertIcon />}
              onClick={convertAll}
              disabled={stats.processing > 0}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Convert All
            </Button>
          </motion.div>
        )}

        {/* Download All Button */}
        {stats.completed > 0 && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={downloadAll}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Download All
            </Button>
          </motion.div>
        )}

        {/* Clear All Button */}
        {stats.total > 0 && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearIcon />}
              onClick={clearFiles}
              sx={{ textTransform: "none" }}
            >
              Clear All
            </Button>
          </motion.div>
        )}
      </Box>
    </Box>
  );
}
