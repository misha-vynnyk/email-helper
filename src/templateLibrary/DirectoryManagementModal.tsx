/**
 * Directory Management Modal Component
 * Allows users to manage allowed directories for template import
 */

import React, { useEffect, useState } from 'react';

import { Delete as DeleteIcon, FolderOpen as FolderOpenIcon } from '@mui/icons-material';
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
} from '@mui/material';

import { addAllowedRoot, getAllowedRoots, removeAllowedRoot } from './templateApi';

interface DirectoryManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DirectoryManagementModal({ open, onClose }: DirectoryManagementModalProps) {
  const [allowedDirectories, setAllowedDirectories] = useState<string[]>([]);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [manualPath, setManualPath] = useState('');
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

      // Also save to localStorage for persistence
      localStorage.setItem('emailBuilder_allowedDirectories', JSON.stringify(directories));
    } catch (err) {
      console.error('Failed to load allowed directories:', err);

      // Fallback to localStorage if API fails
      const savedDirectories = localStorage.getItem('emailBuilder_allowedDirectories');
      if (savedDirectories) {
        try {
          const parsed = JSON.parse(savedDirectories);
          setAllowedDirectories(parsed);
        } catch (parseErr) {
          console.error('Failed to parse saved directories:', parseErr);
        }
      }
    }
  };

  const addDirectoryToAllowed = async (directoryPath: string) => {
    try {
      console.log('🔄 Adding directory:', directoryPath);
      setStatus('Adding directory to allowed folders...');
      await addAllowedRoot({ rootPath: directoryPath });

      // Reload allowed directories
      await loadAllowedDirectories();

      setStatus(`✅ Directory "${directoryPath}" added successfully!`);

      // Clear status after 3 seconds
      setTimeout(() => {
        setStatus(null);
      }, 3000);
    } catch (err) {
      console.error('❌ Failed to add directory:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add directory';
      console.log('Error message:', errorMessage);
      setError(errorMessage);

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  const handleManualAdd = async () => {
    if (!manualPath.trim()) {
      setError('Please enter a directory path');
      return;
    }

    console.log('🔄 Manual add directory:', manualPath.trim());
    await addDirectoryToAllowed(manualPath.trim());
    setManualPath('');
    setShowManualInput(false);
  };

  const handleCancelManual = () => {
    setManualPath('');
    setShowManualInput(false);
    setError(null);
  };

  const handleRemoveDirectory = async (directoryPath: string) => {
    try {
      setStatus('Removing directory from allowed folders...');
      const result = await removeAllowedRoot({ rootPath: directoryPath });

      // Reload allowed directories
      await loadAllowedDirectories();

      setStatus(`✅ Directory "${directoryPath}" removed successfully! ${result.message}`);
      console.log(`🗑️ Removed ${result.removedTemplates} templates from directory: ${directoryPath}`);

      // Clear status after 5 seconds
      setTimeout(() => {
        setStatus(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to remove directory:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove directory');
    }
  };

  const handleClose = () => {
    setError(null);
    setStatus(null);
    setManualPath('');
    setShowManualInput(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Allowed Directories</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            <Typography variant="body2">
              <strong>❌ Error:</strong> {error}
            </Typography>
          </Alert>
        )}

        {status && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {status}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>📁 Allowed Directories:</strong> Only files in these directories can be imported into the template
            library.
          </Typography>
        </Alert>

        {allowedDirectories.length > 0 ? (
          <Box>
            {allowedDirectories.map((dir, index) => (
              <Box
                key={index}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                p={2}
                mb={1}
                border={1}
                borderColor="divider"
                borderRadius={1}
                sx={{ backgroundColor: 'background.paper' }}
              >
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem', flex: 1 }}>
                  {dir}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleRemoveDirectory(dir)}
                  disabled={loading}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Box>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">No directories added yet. Click "Add Directory" to get started.</Typography>
          </Alert>
        )}

        <Box mt={2}>
          <Button
            variant="contained"
            startIcon={<FolderOpenIcon />}
            onClick={() => setShowManualInput(true)}
            disabled={loading}
            fullWidth
          >
            ✏️ Add Directory Path
          </Button>
        </Box>

        {/* Manual Path Input */}
        {showManualInput && (
          <Box mt={2}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>📁 Enter Directory Path:</strong> Type the full path to your templates directory.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Directory Path"
              placeholder="e.g., /Users/yourname/Documents/Templates or ~/Documents/Templates"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              helperText="Examples: ~/Documents/Templates, /Users/username/Documents, C:\Users\username\Documents"
              sx={{ mb: 2 }}
            />

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>💡 Tips:</strong>
                <br />• Use <code>~/</code> for home directory (e.g., ~/Documents)
                <br />• On Windows: <code>C:\Users\YourName\Documents</code>
                <br />• On Mac: <code>/Users/YourName/Documents</code>
                <br />• On Linux: <code>/home/YourName/Documents</code>
              </Typography>
            </Alert>

            <Box display="flex" gap={1}>
              <Button variant="contained" onClick={handleManualAdd} disabled={loading || !manualPath.trim()} fullWidth>
                Add Directory
              </Button>
              <Button variant="outlined" onClick={handleCancelManual} disabled={loading} fullWidth>
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
