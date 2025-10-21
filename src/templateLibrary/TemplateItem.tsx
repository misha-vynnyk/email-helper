/**
 * Template Item Component
 * Displays a single template card with preview and actions
 */

import React, { useEffect, useState } from 'react';

import {
  Add as AddIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Remove as RemoveIcon,
  RestartAlt as RestartAltIcon,
  Send as SendIcon,
  Sync as SyncIcon,
  Visibility,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useEmailSender } from '../emailSender/EmailSenderContext';
import { EmailTemplate, TEMPLATE_CATEGORIES, TemplateCategory } from '../types/template';

import { PreviewConfig } from './PreviewSettings';
import { getTemplateContent, removeTemplate, syncTemplate, updateTemplate } from './templateApi';
import { getCategoryIcon } from './templateCategoryIcons';

interface TemplateItemProps {
  template: EmailTemplate;
  previewConfig: PreviewConfig;
  onDelete?: (templateId: string) => void;
  onUpdate?: (updatedTemplate: EmailTemplate) => void;
  onLoadTemplate?: (html: string, template: EmailTemplate) => void;
}

export default function TemplateItem({
  template,
  previewConfig,
  onDelete,
  onUpdate,
  onLoadTemplate,
}: TemplateItemProps) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Email Sender context
  const { sendEmailDirect, areCredentialsValid } = useEmailSender();

  // Edit state
  const [editedName, setEditedName] = useState(template.name);
  const [editedCategory, setEditedCategory] = useState<TemplateCategory>(template.category);
  const [editedTags, setEditedTags] = useState(template.tags.join(', '));
  const [editedDescription, setEditedDescription] = useState(template.description || '');

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [zoom, setZoom] = useState(1);

  // Keyboard shortcuts for zoom in preview dialog
  useEffect(() => {
    if (!previewDialogOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => Math.min(3, z + 0.1));
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((z) => Math.max(0.25, z - 0.1));
      } else if (e.key === 'r' || e.key === 'R' || e.key === '0') {
        e.preventDefault();
        setZoom(1);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((z) => Math.min(3, z + 0.1));
        } else {
          setZoom((z) => Math.max(0.25, z - 0.1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [previewDialogOpen]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load content only when visible
  useEffect(() => {
    if (isVisible && !previewHtml && !loading) {
      loadContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  // Reload when preview dialog opens if content is stale
  useEffect(() => {
    if (previewDialogOpen && !previewHtml) {
      loadContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDialogOpen]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const content = await getTemplateContent(template.id);
      setPreviewHtml(content);
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to load template: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      if (!previewHtml) {
        await loadContent();
      }
      const content = previewHtml || (await getTemplateContent(template.id));
      await navigator.clipboard.writeText(content);
      setSnackbar({
        open: true,
        message: `"${template.name}" HTML copied to clipboard`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Copy failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
    }
  };

  const handleLoadTemplate = async () => {
    try {
      if (!previewHtml) {
        await loadContent();
      }
      const content = previewHtml || (await getTemplateContent(template.id));
      onLoadTemplate?.(content, template);
      setSnackbar({
        open: true,
        message: `"${template.name}" loaded into editor`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to load: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const synced = await syncTemplate(template.id);
      onUpdate?.(synced);
      setSnackbar({
        open: true,
        message: `"${template.name}" synced successfully`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await updateTemplate(template.id, {
        name: editedName,
        category: editedCategory,
        tags: editedTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        description: editedDescription || undefined,
      });
      onUpdate?.(updated);
      setEditDialogOpen(false);
      setSnackbar({
        open: true,
        message: `"${template.name}" updated successfully`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Update failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await removeTemplate(template.id);
      onDelete?.(template.id);
      setDeleteDialogOpen(false);
      setSnackbar({
        open: true,
        message: `"${template.name}" removed from library`,
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Delete failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Remove script tags from HTML for safe preview (prevents sandbox console errors)
  const sanitizePreviewHtml = (html: string): string => {
    if (!html) return html;
    // Remove all script tags and their content
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  };

  // Calculate scale to fit template in container
  const previewScale = previewConfig.containerHeight / previewConfig.cardHeight;

  return (
    <>
      <Card ref={cardRef} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Preview Area */}
        <Box
          sx={{
            position: 'relative',
            height: previewConfig.containerHeight,
            minHeight: 150, // Minimum height for usability
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderBottom: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            '&:hover .quick-actions': { opacity: 1 },
          }}
          onClick={() => setPreviewDialogOpen(true)}
        >
          {loading ? (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%">
              <Typography variant="body2" color="text.secondary">
                Loading preview...
              </Typography>
            </Box>
          ) : previewHtml ? (
            <iframe
              srcDoc={sanitizePreviewHtml(previewHtml)}
              title={`Preview of ${template.name}`}
              style={{
                width: `${previewConfig.cardWidth}px`,
                height: `${previewConfig.cardHeight}px`,
                border: 'none',
                pointerEvents: 'none',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              sandbox="allow-same-origin"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No Preview Available
            </Typography>
          )}

          {/* Quick Actions Overlay */}
          <Box
            className="quick-actions"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              opacity: 0,
              transition: 'opacity 0.2s ease',
              display: 'flex',
              gap: 0.5,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              borderRadius: 1,
              p: 0.5,
              backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip title="Quick copy">
              <IconButton size="small" onClick={handleCopyCode} sx={{ color: 'white' }}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Full preview">
              <IconButton size="small" onClick={() => setPreviewDialogOpen(true)} sx={{ color: 'white' }}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Content */}
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box>
              <Typography variant="h6" component="h3" fontWeight={600} sx={{ fontSize: '1rem' }}>
                {template.name}
              </Typography>
              {template.folderPath && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                >
                  📁 {template.folderPath}
                </Typography>
              )}
            </Box>
          </Box>

          <Chip icon={getCategoryIcon(template.category)} label={template.category} size="small" sx={{ mb: 1 }} />

          {template.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
              {template.description}
            </Typography>
          )}

          <Box display="flex" flexWrap="wrap" gap={0.5} mb={1}>
            {template.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
            ))}
            {template.tags.length > 3 && (
              <Chip
                label={`+${template.tags.length - 3}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            )}
          </Box>

          <Typography variant="caption" color="text.secondary" display="block">
            {formatFileSize(template.fileSize)} • {formatDate(template.lastModified)}
          </Typography>
        </CardContent>

        {/* Actions */}
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Box display="flex" gap={1}>
            <Tooltip title="Load into editor">
              <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleLoadTemplate}>
                Load
              </Button>
            </Tooltip>
            <Tooltip title={areCredentialsValid ? 'Send as email' : 'Configure email credentials first'}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<SendIcon />}
                  disabled={!areCredentialsValid || sending}
                  onClick={async () => {
                    try {
                      setSending(true);

                      // Завантажуємо HTML якщо ще не завантажено
                      let html = previewHtml;
                      if (!html) {
                        const content = await getTemplateContent(template.id);
                        html = content;
                        setPreviewHtml(html);
                      }

                      if (!html || html.trim().length === 0) {
                        throw new Error('Template HTML is empty');
                      }

                      // Відправляємо email напряму з HTML і subject
                      await sendEmailDirect(html, template.name || 'Email Template');

                      setSnackbar({
                        open: true,
                        message: 'Email sent successfully!',
                        severity: 'success',
                      });
                    } catch (error) {
                      console.error('❌ Failed to send email:', error);
                      setSnackbar({
                        open: true,
                        message: error instanceof Error ? error.message : 'Failed to send email',
                        severity: 'error',
                      });
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  {sending ? 'Sending...' : 'Send'}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Copy HTML code">
              <IconButton size="small" onClick={handleCopyCode}>
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="View code">
              <IconButton size="small" onClick={() => setCodeDialogOpen(true)}>
                <CodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box display="flex" gap={0.5}>
            <Tooltip title="Sync from file">
              <span>
                <IconButton size="small" onClick={handleSync} disabled={syncing}>
                  <SyncIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Edit metadata">
              <IconButton size="small" onClick={() => setEditDialogOpen(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove from library">
              <IconButton size="small" onClick={() => setDeleteDialogOpen(true)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardActions>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => {
          setPreviewDialogOpen(false);
          setZoom(1);
        }}
        maxWidth={previewConfig.dialogMaxWidth}
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{template.name} - Preview</Typography>
            <Box display="flex" gap={1} alignItems="center">
              <ButtonGroup size="small" variant="outlined">
                <Tooltip title="Zoom out (-)">
                  <span>
                    <Button onClick={() => setZoom((z) => Math.max(0.25, z - 0.1))} disabled={zoom <= 0.25}>
                      <RemoveIcon fontSize="small" />
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="Reset zoom (R)">
                  <span>
                    <Button onClick={() => setZoom(1)} disabled={zoom === 1}>
                      <RestartAltIcon fontSize="small" />
                    </Button>
                  </span>
                </Tooltip>
                <Button disabled sx={{ minWidth: 70 }}>
                  {Math.round(zoom * 100)}%
                </Button>
                <Tooltip title="Zoom in (+)">
                  <span>
                    <Button onClick={() => setZoom((z) => Math.min(3, z + 0.1))} disabled={zoom >= 3}>
                      <AddIcon fontSize="small" />
                    </Button>
                  </span>
                </Tooltip>
              </ButtonGroup>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <Typography>Loading...</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                overflow: 'auto',
                maxHeight: '70vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                p: 2,
                bgcolor: '#f5f5f5',
              }}
            >
              <Box
                sx={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: '#fff',
                  minHeight: 200,
                  p: 2,
                  boxShadow: 2,
                }}
                dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(previewHtml || '') }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
            💡 Tip: Use <strong>+/-</strong> keys, <strong>R</strong> to reset, or <strong>Ctrl+Scroll</strong> to zoom
          </Typography>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Code Dialog */}
      <Dialog
        open={codeDialogOpen}
        onClose={() => setCodeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>HTML Code - {template.name}</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            rows={15}
            value={previewHtml || 'Loading...'}
            InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopyCode} startIcon={<CopyIcon />}>
            Copy
          </Button>
          <Button onClick={() => setCodeDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>Edit Template Metadata</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Category"
            value={editedCategory}
            onChange={(e) => setEditedCategory(e.target.value as TemplateCategory)}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            {TEMPLATE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Tags (comma-separated)"
            value={editedTags}
            onChange={(e) => setEditedTags(e.target.value)}
            helperText="e.g., promotional, product, sale"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
          />
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              <strong>File Path:</strong> {template.filePath}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>Remove Template?</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>"{template.name}"</strong> from library?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This will not delete the file from your system. The file will remain at: <code>{template.filePath}</code>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
