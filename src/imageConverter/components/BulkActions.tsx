/**
 * Bulk Actions Toolbar
 * Provides bulk selection and operations UI
 */

import {
  CheckBox as CheckedIcon,
  CheckBoxOutlineBlank as UncheckedIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  PlayArrow as ConvertIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { useImageConverter } from "../context/ImageConverterContext";

export default function BulkActions() {
  const {
    files,
    selectedCount,
    selectAll,
    deselectAll,
    removeSelected,
    downloadSelected,
    convertSelected,
  } = useImageConverter();

  const allSelected = files.length > 0 && selectedCount === files.length;
  const someSelected = selectedCount > 0 && !allSelected;

  if (files.length === 0) return null;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 5,
        mb: 2,
        bgcolor: selectedCount > 0 ? "primary.50" : "background.paper",
        transition: "background-color 0.3s ease",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
      >
        {/* Selection Controls */}
        <Box display="flex" alignItems="center" gap={1}>
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
            icon={<UncheckedIcon />}
            checkedIcon={<CheckedIcon />}
            indeterminateIcon={<CheckedIcon />}
          />
          <Typography variant="body2" fontWeight={500}>
            {selectedCount > 0 ? (
              <>
                {selectedCount} of {files.length} selected
              </>
            ) : (
              <>Select All ({files.length})</>
            )}
          </Typography>
        </Box>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              startIcon={<ConvertIcon />}
              onClick={convertSelected}
              sx={{ textTransform: "none" }}
            >
              Convert Selected
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadSelected}
              sx={{ textTransform: "none" }}
            >
              Download Selected
            </Button>
            <IconButton
              size="small"
              onClick={removeSelected}
              color="error"
              sx={{
                "&:hover": {
                  bgcolor: "error.light",
                  color: "white",
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={deselectAll}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </Stack>

      {/* Status Chips */}
      {selectedCount > 0 && (
        <Box mt={1} display="flex" gap={0.5}>
          {files.filter((f) => f.selected && f.status === "done").length > 0 && (
            <Chip
              label={`${
                files.filter((f) => f.selected && f.status === "done").length
              } Done`}
              size="small"
              color="success"
              variant="outlined"
            />
          )}
          {files.filter((f) => f.selected && f.status === "pending").length > 0 && (
            <Chip
              label={`${
                files.filter((f) => f.selected && f.status === "pending").length
              } Pending`}
              size="small"
              color="default"
              variant="outlined"
            />
          )}
          {files.filter((f) => f.selected && f.status === "processing").length > 0 && (
            <Chip
              label={`${
                files.filter((f) => f.selected && f.status === "processing").length
              } Processing`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {files.filter((f) => f.selected && f.status === "error").length > 0 && (
            <Chip
              label={`${
                files.filter((f) => f.selected && f.status === "error").length
              } Error`}
              size="small"
              color="error"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Paper>
  );
}

