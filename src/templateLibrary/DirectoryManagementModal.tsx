/**
 * Directory Management Modal Component
 * Allows users to manage allowed directories for template import
 */

import { useEffect, useMemo, useState } from "react";

import { Delete as DeleteIcon, FolderOpen as FolderOpenIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

import { addAllowedRoot, getAllowedRoots, removeAllowedRoot } from "./templateApi";
import { StyledPaper, useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";

interface DirectoryManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DirectoryManagementModal({ open, onClose }: DirectoryManagementModalProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = useMemo(() => getComponentStyles(mode, style), [mode, style]);

  const [allowedDirectories, setAllowedDirectories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [manualPath, setManualPath] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Load allowed directories when modal opens
  useEffect(() => {
    if (open) {
      loadAllowedDirectories();
    }
  }, [open]);

  const loadAllowedDirectories = async () => {
    try {
      const directories = await getAllowedRoots();
      setAllowedDirectories(directories);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load allowed directories";
      setError(errorMessage);
    }
  };

  const addDirectoryToAllowed = async (directoryPath: string) => {
    try {
      setStatus("Adding directory to allowed folders...");
      await addAllowedRoot({ rootPath: directoryPath });

      // Reload allowed directories
      await loadAllowedDirectories();

      setStatus(`Directory "${directoryPath}" added successfully!`);

      // Clear status after 3 seconds
      setTimeout(() => {
        setStatus(null);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add directory";
      setError(errorMessage);

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const handleManualAdd = async () => {
    if (!manualPath.trim()) {
      setError("Please enter a directory path");
      return;
    }

    await addDirectoryToAllowed(manualPath.trim());
    setManualPath("");
    setShowManualInput(false);
  };

  const handleCancelManual = () => {
    setManualPath("");
    setShowManualInput(false);
    setError(null);
  };

  const handleRemoveDirectory = async (directoryPath: string) => {
    try {
      setStatus("Removing directory from allowed folders...");
      const result = await removeAllowedRoot({ rootPath: directoryPath });

      // Reload allowed directories
      await loadAllowedDirectories();

      setStatus(`Directory "${directoryPath}" removed successfully! ${result.message}`);

      // Clear status after 5 seconds
      setTimeout(() => {
        setStatus(null);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove directory");
    }
  };

  const handleClose = () => {
    setError(null);
    setStatus(null);
    setManualPath("");
    setShowManualInput(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${componentStyles.card.borderRadius}px`,
          background:
            componentStyles.card.background || alpha(theme.palette.background.paper, 0.9),
          backdropFilter: componentStyles.card.backdropFilter,
          WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
          border: componentStyles.card.border,
          boxShadow: componentStyles.card.boxShadow,
        },
      }}
    >
      <DialogTitle>Manage Allowed Directories</DialogTitle>
      <DialogContent>
        {error && (
          <Alert
            severity='error'
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            <Typography variant='body2'>
              <strong>Error:</strong> {error}
            </Typography>
          </Alert>
        )}

        {status && (
          <Alert
            severity='info'
            sx={{ mb: 2 }}
          >
            {status}
          </Alert>
        )}

        <Alert
          severity='info'
          sx={{ mb: 2 }}
        >
          <Typography variant='body2'>
            <strong>Allowed Directories:</strong> Only files in these directories can be imported
            into the template library.
          </Typography>
        </Alert>

        {allowedDirectories.length > 0 ? (
          <Box>
            {allowedDirectories.map((dir, index) => (
              <StyledPaper
                key={index}
                backgroundAlpha={0.85}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 2,
                  mb: 1,
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ fontFamily: "monospace", fontSize: "0.875rem", flex: 1 }}
                >
                  {dir}
                </Typography>
                <Button
                  variant='outlined'
                  color='error'
                  size='small'
                  startIcon={<DeleteIcon />}
                  onClick={() => handleRemoveDirectory(dir)}
                >
                  Remove
                </Button>
              </StyledPaper>
            ))}
          </Box>
        ) : (
          <Alert
            severity='warning'
            sx={{ mb: 2 }}
          >
            <Typography variant='body2'>
              No directories added yet. Click "Add Directory" to get started.
            </Typography>
          </Alert>
        )}

        <Box mt={2}>
          <Button
            variant='contained'
            startIcon={<FolderOpenIcon />}
            onClick={() => setShowManualInput(true)}
            fullWidth
          >
            Add Directory Path
          </Button>
        </Box>

        {/* Manual Path Input */}
        {showManualInput && (
          <Box mt={2}>
            <Alert
              severity='info'
              sx={{ mb: 2 }}
            >
              <Typography variant='body2'>
                <strong>Enter Directory Path:</strong> Type the full path to your templates
                directory.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label='Directory Path'
              placeholder='e.g., /Users/yourname/Documents/Templates or ~/Documents/Templates'
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              helperText='Examples: ~/Documents/Templates, /Users/username/Documents, C:\Users\username\Documents'
              sx={{ mb: 2 }}
            />

            <Alert
              severity='warning'
              sx={{ mb: 2 }}
            >
              <Typography variant='body2'>
                <strong>Tips:</strong>
                <br />• Use <code>~/</code> for home directory (e.g., ~/Documents)
                <br />• On Windows: <code>C:\Users\YourName\Documents</code>
                <br />• On Mac: <code>/Users/YourName/Documents</code>
                <br />• On Linux: <code>/home/YourName/Documents</code>
              </Typography>
            </Alert>

            <Box
              display='flex'
              gap={1}
            >
              <Button
                variant='contained'
                onClick={handleManualAdd}
                disabled={!manualPath.trim()}
                fullWidth
              >
                Add Directory
              </Button>
              <Button
                variant='outlined'
                onClick={handleCancelManual}
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
