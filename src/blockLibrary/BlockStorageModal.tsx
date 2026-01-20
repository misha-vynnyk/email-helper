/**
 * Block Storage Modal
 * Manage storage locations for new blocks with add/remove capabilities
 */

import { useState } from "react";

import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  FolderOpen,
  Star as StarIcon,
  StarOutline as StarOutlineIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  addStorageLocation,
  getStorageLocations,
  removeStorageLocation,
  setDefaultLocation,
  StorageLocation,
  toggleLocationVisibility,
} from "./blockStorageConfig";

interface BlockStorageModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function BlockStorageModal({ open, onClose, onSave }: BlockStorageModalProps) {
  const [locations, setLocations] = useState<StorageLocation[]>(getStorageLocations(true)); // Include hidden
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationPath, setNewLocationPath] = useState("");
  const [newLocationDescription, setNewLocationDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleAddLocation = () => {
    try {
      if (!newLocationName.trim() || !newLocationPath.trim()) {
        setError("Name and path are required");
        return;
      }

      // Validate that path is absolute (starts with /)
      const trimmedPath = newLocationPath.trim();
      if (!trimmedPath.startsWith("/")) {
        setError(
          "Path must be absolute (start with /). Example: /Users/your-name/Documents/blocks"
        );
        return;
      }

      const updated = addStorageLocation(newLocationName, trimmedPath, newLocationDescription);
      setLocations(updated);
      setNewLocationName("");
      setNewLocationPath("");
      setNewLocationDescription("");
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add location");
    }
  };

  const handleToggleVisibility = (id: string) => {
    try {
      const updated = toggleLocationVisibility(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle visibility");
    }
  };

  const handleRemoveLocation = (id: string) => {
    try {
      const updated = removeStorageLocation(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove location");
    }
  };

  const handleSetDefault = (id: string) => {
    try {
      const updated = setDefaultLocation(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default");
    }
  };

  const handleClose = () => {
    setLocations(getStorageLocations(true)); // Include hidden
    setNewLocationName("");
    setNewLocationPath("");
    setNewLocationDescription("");
    setShowAddForm(false);
    setError(null);
    setSaved(false);
    onClose();
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (onSave) onSave();
      handleClose();
    }, 500);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
        >
          <Box
            display='flex'
            alignItems='center'
            gap={1}
          >
            <FolderOpen />
            <Typography variant='h6'>Block Storage Locations</Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            size='small'
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {saved && (
          <Alert
            severity='success'
            sx={{ mb: 2 }}
          >
            ✅ Configuration saved!
          </Alert>
        )}

        {error && (
          <Alert
            severity='error'
            sx={{ mb: 2 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Alert
          severity='info'
          sx={{ mb: 3 }}
        >
          <Typography
            variant='body2'
            component='div'
          >
            <strong>💡 Paths:</strong> Use <strong>relative</strong> paths (e.g. `src/blocks`) or{" "}
            <strong>absolute</strong> paths within your Documents folder. Click ⭐ to set default.
          </Typography>
        </Alert>

        {/* Locations List */}
        {locations.length > 0 ? (
          <List sx={{ mb: 2 }}>
            {locations.map((location) => (
              <ListItem
                key={location.id}
                sx={{
                  border: "1px solid",
                  borderColor: location.isDefault ? "primary.main" : "divider",
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: location.isDefault ? "action.selected" : "background.paper",
                }}
              >
                <ListItemText
                  primary={
                    <Box
                      display='flex'
                      alignItems='center'
                      gap={1}
                    >
                      <Typography
                        variant='body1'
                        fontWeight={location.isDefault ? 600 : 400}
                        sx={{
                          textDecoration: location.isHidden ? "line-through" : "none",
                          opacity: location.isHidden ? 0.6 : 1,
                        }}
                      >
                        {location.name}
                      </Typography>
                      {location.isDefault && !location.isHidden && (
                        <Chip
                          label='Default'
                          size='small'
                          color='primary'
                        />
                      )}
                      {location.isHidden && (
                        <Chip
                          label='Hidden'
                          size='small'
                          color='default'
                          variant='outlined'
                        />
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{ component: "div" }}
                  secondary={
                    <Box component='div'>
                      <Typography
                        variant='caption'
                        color='text.secondary'
                        component='div'
                        display='block'
                      >
                        📁 {location.path}
                      </Typography>
                      {location.description && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          component='div'
                          display='block'
                        >
                          {location.description}
                        </Typography>
                      )}
                    </Box>
                  }
                  secondaryTypographyProps={{ component: "div" }}
                />
                <Box
                  display='flex'
                  gap={1}
                >
                  <Tooltip title={location.isHidden ? "Show location" : "Hide location"}>
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => handleToggleVisibility(location.id)}
                      >
                        {location.isHidden ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title='Set as default'>
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => handleSetDefault(location.id)}
                        disabled={location.isDefault || location.isHidden}
                      >
                        {location.isDefault ? <StarIcon color='primary' /> : <StarOutlineIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title='Remove location'>
                    <span>
                      <IconButton
                        size='small'
                        onClick={() => handleRemoveLocation(location.id)}
                        color='error'
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert
            severity='warning'
            sx={{ mb: 2 }}
          >
            No storage locations configured. Add at least one location.
          </Alert>
        )}

        {/* Add Location Form */}
        {showAddForm ? (
          <Box sx={{ border: "2px dashed", borderColor: "primary.main", p: 2, borderRadius: 1 }}>
            <Typography
              variant='subtitle2'
              gutterBottom
              fontWeight={600}
            >
              ➕ Add New Location
            </Typography>
            <TextField
              fullWidth
              label='Location Name'
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder='e.g., Custom Blocks, External Project'
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label='Directory Path'
              value={newLocationPath}
              onChange={(e) => setNewLocationPath(e.target.value)}
              placeholder='e.g., /Users/your-name/Documents/my-blocks'
              helperText='Must be an absolute path (start with /)'
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label='Description (optional)'
              value={newLocationDescription}
              onChange={(e) => setNewLocationDescription(e.target.value)}
              placeholder='e.g., Shared blocks for multiple projects'
              sx={{ mb: 2 }}
            />
            <Box
              display='flex'
              gap={1}
            >
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={handleAddLocation}
              >
                Add Location
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  setShowAddForm(false);
                  setNewLocationName("");
                  setNewLocationPath("");
                  setNewLocationDescription("");
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Button
            fullWidth
            variant='outlined'
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            sx={{ borderStyle: "dashed" }}
          >
            Add Storage Location
          </Button>
        )}

        {/* Info Alert */}
        <Alert
          severity='warning'
          sx={{ mt: 2 }}
        >
          <Typography
            variant='caption'
            component='div'
          >
            <strong>Security:</strong> Paths outside project directory must be within your Documents
            folder. Backend validates all paths to prevent unauthorized access.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}
