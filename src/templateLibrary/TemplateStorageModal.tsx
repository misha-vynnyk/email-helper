/**
 * Template Storage Modal
 * Manage storage locations for template synchronization with add/remove capabilities
 */

import { useMemo, useState } from "react";

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
import { alpha, useTheme } from "@mui/material/styles";

import {
  addTemplateStorageLocation,
  getTemplateStorageLocations,
  removeTemplateStorageLocation,
  setDefaultTemplateLocation,
  TemplateStorageLocation,
  toggleTemplateLocationVisibility,
} from "./templateStorageConfig";
import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";

interface TemplateStorageModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function TemplateStorageModal({ open, onClose, onSave }: TemplateStorageModalProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = useMemo(() => getComponentStyles(mode, style), [mode, style]);

  const [locations, setLocations] = useState<TemplateStorageLocation[]>(
    getTemplateStorageLocations(true)
  ); // Include hidden
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
          "Path must be absolute (start with /). Example: /Users/your-name/Documents/templates"
        );
        return;
      }

      const updated = addTemplateStorageLocation(
        newLocationName,
        trimmedPath,
        newLocationDescription
      );
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
      const updated = toggleTemplateLocationVisibility(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle visibility");
    }
  };

  const handleRemoveLocation = (id: string) => {
    try {
      const updated = removeTemplateStorageLocation(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove location");
    }
  };

  const handleSetDefault = (id: string) => {
    try {
      const updated = setDefaultTemplateLocation(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default");
    }
  };

  const handleClose = () => {
    setLocations(getTemplateStorageLocations(true)); // Include hidden
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

  const visibleLocations = locations.filter((loc) => !loc.isHidden);

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
      <DialogTitle>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
        >
          <Box>
            <Typography
              variant='h6'
              component='span'
            >
              Template Storage Locations
            </Typography>
            <Typography
              variant='caption'
              display='block'
              color='text.secondary'
            >
              Manage directories for template synchronization
            </Typography>
          </Box>
          <IconButton
            onClick={handleClose}
            size='small'
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert
            severity='error'
            onClose={() => setError(null)}
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {saved && (
          <Alert
            severity='success'
            sx={{ mb: 2 }}
          >
            Configuration saved successfully!
          </Alert>
        )}

        {/* Existing Locations */}
        <Box mb={3}>
          <Typography
            variant='subtitle2'
            gutterBottom
            fontWeight={600}
          >
            Configured Locations ({locations.length})
          </Typography>

          {locations.length === 0 ? (
            <Alert severity='info'>
              No storage locations configured. Add a location to enable template synchronization.
            </Alert>
          ) : (
            <List>
              {locations.map((location) => (
                <ListItem
                  key={location.id}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: location.isHidden ? "action.disabledBackground" : "background.paper",
                    opacity: location.isHidden ? 0.6 : 1,
                  }}
                  secondaryAction={
                    <Box
                      display='flex'
                      gap={0.5}
                    >
                      {/* Toggle Visibility Button */}
                      <Tooltip title={location.isHidden ? "Show" : "Hide"}>
                        <IconButton
                          size='small'
                          onClick={() => handleToggleVisibility(location.id)}
                        >
                          {location.isHidden ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </Tooltip>

                      {/* Set Default Button */}
                      <Tooltip title={location.isDefault ? "Default location" : "Set as default"}>
                        <span>
                          <IconButton
                            size='small'
                            onClick={() => handleSetDefault(location.id)}
                            disabled={location.isDefault || location.isHidden}
                            color={location.isDefault ? "primary" : "default"}
                          >
                            {location.isDefault ? <StarIcon /> : <StarOutlineIcon />}
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* Remove Button */}
                      <Tooltip title='Remove location'>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleRemoveLocation(location.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box
                        display='flex'
                        alignItems='center'
                        gap={1}
                        sx={{ textDecoration: location.isHidden ? "line-through" : "none" }}
                      >
                        <FolderOpen fontSize='small' />
                        <Typography fontWeight={600}>{location.name}</Typography>
                        {location.isDefault && (
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
                            variant='outlined'
                          />
                        )}
                      </Box>
                    }
                    primaryTypographyProps={{ component: "div" }}
                    secondary={
                      <>
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          component='span'
                          display='block'
                        >
                          {location.path}
                        </Typography>
                        {location.description && (
                          <Typography
                            variant='caption'
                            color='text.secondary'
                            component='span'
                          >
                            {location.description}
                          </Typography>
                        )}
                      </>
                    }
                    secondaryTypographyProps={{ component: "div" }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Add New Location Form */}
        {!showAddForm ? (
          <Button
            variant='outlined'
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            fullWidth
          >
            Add New Location
          </Button>
        ) : (
          <Box
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: "background.paper",
            }}
          >
            <Typography
              variant='subtitle2'
              gutterBottom
              fontWeight={600}
            >
              Add New Location
            </Typography>

            <TextField
              label='Location Name'
              fullWidth
              size='small'
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder='e.g., Project Templates'
              sx={{ mb: 2 }}
              autoFocus
            />

            <TextField
              label='Directory Path'
              fullWidth
              size='small'
              value={newLocationPath}
              onChange={(e) => setNewLocationPath(e.target.value)}
              placeholder='/Users/your-name/Documents/templates'
              helperText='Must be an absolute path (starting with /)'
              sx={{ mb: 2 }}
            />

            <TextField
              label='Description (Optional)'
              fullWidth
              size='small'
              value={newLocationDescription}
              onChange={(e) => setNewLocationDescription(e.target.value)}
              placeholder='Additional notes about this location'
              sx={{ mb: 2 }}
            />

            <Box
              display='flex'
              gap={1}
            >
              <Button
                variant='contained'
                onClick={handleAddLocation}
                fullWidth
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
                fullWidth
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          color='inherit'
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={visibleLocations.length === 0}
        >
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
}
