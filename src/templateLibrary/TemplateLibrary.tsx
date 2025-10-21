/**
 * Template Library Component
 * Main UI for browsing and managing HTML email templates from file system
 */

import React, { useEffect, useMemo, useState } from 'react';

import {
  Add as AddIcon,
  Clear as ClearIcon,
  FolderOpen as FolderOpenIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  SearchOff as SearchOffIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';

import { EmailTemplate, TemplateCategory } from '../types/template';

import DirectoryManagementModal from './DirectoryManagementModal';
import PreviewSettings, { loadPreviewConfig, PreviewConfig } from './PreviewSettings';
import { listTemplates, syncAllTemplates } from './templateApi';
import { getCategoryIcon } from './templateCategoryIcons';
import TemplateItem from './TemplateItem';

const CATEGORY_OPTIONS: Array<TemplateCategory | 'All'> = [
  'All',
  'Newsletter',
  'Transactional',
  'Marketing',
  'Internal',
  'Other',
];

type SortOption = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'category';

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'All'>('All');
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('date-newest');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig>(loadPreviewConfig());
  const loadingRef = React.useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (cancelled || loadingRef.current) return;
      loadingRef.current = true;
      try {
        // First load existing templates
        await loadTemplates();

        // Then sync to find new files
        if (!cancelled) {
          await syncTemplates();
        }
      } finally {
        loadingRef.current = false;
      }
    };

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTemplates();
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setTemplates(data);
      } else {
        console.error('API returned non-array data:', data);
        setTemplates([]);
        setError('Invalid data format from server');
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      setTemplates([]); // Ensure templates is always an array
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const syncTemplates = async () => {
    setSyncing(true);
    setSyncMessage(null);
    setError(null);

    try {
      console.log('🔄 Starting template sync...');
      const result = await syncAllTemplates({
        recursive: true,
        category: 'Other',
      });

      console.log('✅ Sync completed:', result);
      setSyncMessage(result.message);

      // Reload templates after sync
      await loadTemplates();
    } catch (err) {
      console.error('❌ Sync failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync templates');
    } finally {
      setSyncing(false);
    }
  };

  // const handleTemplateAdded = (template: EmailTemplate | EmailTemplate[]) => {
  //   if (Array.isArray(template)) {
  //     // Folder import
  //     setTemplates((prev) => [...prev, ...template]);
  //   } else {
  //     // Single template
  //     setTemplates((prev) => [...prev, template]);
  //   }
  // };

  const handleTemplateDeleted = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const handleTemplateUpdated = (updated: EmailTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  // Extract unique root folders from templates (memoized)
  const rootFolders = useMemo(() => {
    const folders = new Set<string>();
    (Array.isArray(templates) ? templates : []).forEach((template) => {
      if (template.folderPath) {
        // Extract first-level folder (e.g., "Finance" from "Finance / DailyMarketClue.com")
        const rootFolder = template.folderPath.split(' / ')[0];
        if (rootFolder) {
          folders.add(rootFolder);
        }
      }
    });
    return Array.from(folders).sort();
  }, [templates]);

  // Folder statistics (memoized)
  const folderStats = useMemo(() => {
    const stats: Record<string, number> = {};
    (Array.isArray(templates) ? templates : []).forEach((template) => {
      if (template.folderPath) {
        const rootFolder = template.folderPath.split(' / ')[0];
        if (rootFolder) {
          stats[rootFolder] = (stats[rootFolder] || 0) + 1;
        }
      }
    });
    return stats;
  }, [templates]);

  // Filter and sort templates - ensure templates is always an array
  const filteredTemplates = React.useMemo(() => {
    // Filter
    const filtered = (Array.isArray(templates) ? templates : []).filter((template) => {
      // Category filter
      if (selectedCategory !== 'All' && template.category !== selectedCategory) {
        return false;
      }

      // Folder filter (root level)
      if (selectedFolder !== 'All') {
        const rootFolder = template.folderPath?.split(' / ')[0];
        if (rootFolder !== selectedFolder) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.category.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          template.description?.toLowerCase().includes(query) ||
          template.filePath.toLowerCase().includes(query) ||
          template.folderPath?.toLowerCase().includes(query) // Search in folder structure
        );
      }

      return true;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        case 'name-desc':
          return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
        case 'date-newest':
          return (b.lastModified || 0) - (a.lastModified || 0);
        case 'date-oldest':
          return (a.lastModified || 0) - (b.lastModified || 0);
        case 'category': {
          const categoryCompare = a.category.localeCompare(b.category);
          if (categoryCompare !== 0) return categoryCompare;
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        }
        default:
          return 0;
      }
    });

    return sorted;
  }, [templates, selectedCategory, selectedFolder, searchQuery, sortBy]);

  // Skeleton Loading State
  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header skeleton */}
        <Box p={2} borderBottom="1px solid" borderColor="divider">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Skeleton variant="text" width={250} height={32} />
              <Skeleton variant="text" width={150} height={20} />
            </Box>
            <Skeleton variant="rectangular" width={180} height={36} sx={{ borderRadius: 1 }} />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
            </Grid>
          </Grid>
        </Box>

        {/* Templates skeleton */}
        <Box flex={1} overflow="auto" p={2}>
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card>
                  <Skeleton variant="rectangular" height={180} />
                  <CardContent>
                    <Skeleton variant="text" width="70%" height={24} />
                    <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="85%" height={20} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box p={2} borderBottom="1px solid" borderColor="divider">
        {/* Title and Stats */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" component="h2">
              HTML Template Library
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filteredTemplates.length} {filteredTemplates.length === 1 ? 'template' : 'templates'}
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedFolder !== 'All' && ` in 📁 ${selectedFolder}`}
              {selectedCategory !== 'All' && ` • ${selectedCategory}`}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <PreviewSettings config={previewConfig} onChange={setPreviewConfig} />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={syncTemplates}
              disabled={syncing || loading}
              size="small"
            >
              {syncing ? 'Syncing...' : 'Sync Templates'}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddModalOpen(true)} size="small">
              Manage Directories
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates by name, category, tags, folder, or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <MenuItem value="date-newest">📅 Newest File First</MenuItem>
              <MenuItem value="date-oldest">📅 Oldest File First</MenuItem>
              <MenuItem value="name-asc">🔤 Name (A-Z)</MenuItem>
              <MenuItem value="name-desc">🔤 Name (Z-A)</MenuItem>
              <MenuItem value="category">📂 Category</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2.5}>
            <TextField
              fullWidth
              size="small"
              select
              label="Folder"
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
            >
              <MenuItem value="All">
                <Box display="flex" alignItems="center" gap={1}>
                  <FolderOpenIcon fontSize="small" />
                  <span>All Folders</span>
                  <Chip label={templates.length} size="small" sx={{ ml: 'auto' }} />
                </Box>
              </MenuItem>
              {rootFolders.map((folder) => (
                <MenuItem key={folder} value={folder}>
                  <Box display="flex" alignItems="center" gap={1} width="100%">
                    <span>📁 {folder}</span>
                    <Chip label={folderStats[folder] || 0} size="small" sx={{ ml: 'auto' }} />
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2.5}>
            <TextField
              fullWidth
              size="small"
              select
              label="Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'All')}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getCategoryIcon(cat)}
                    <span>{cat}</span>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        {/* Quick Folder Filter Chips */}
        {rootFolders.length > 0 && (
          <Box mt={2} display="flex" gap={1} flexWrap="wrap">
            <Chip
              label="All"
              variant={selectedFolder === 'All' ? 'filled' : 'outlined'}
              color={selectedFolder === 'All' ? 'primary' : 'default'}
              onClick={() => setSelectedFolder('All')}
              icon={<FolderOpenIcon />}
              size="small"
            />
            {rootFolders.map((folder) => (
              <Chip
                key={folder}
                label={`${folder} (${folderStats[folder] || 0})`}
                variant={selectedFolder === folder ? 'filled' : 'outlined'}
                color={selectedFolder === folder ? 'primary' : 'default'}
                onClick={() => setSelectedFolder(folder)}
                onDelete={selectedFolder === folder ? () => setSelectedFolder('All') : undefined}
                deleteIcon={<ClearIcon />}
                size="small"
              />
            ))}
          </Box>
        )}

        {/* Security Notice */}
        {templates.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>🔒 Restricted Access:</strong> Only files in <code>~/Templates</code> are accessible by default.
              You can add more folders via API if needed.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Error State */}
      {error && (
        <Box p={2}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      {/* Sync Message */}
      {syncMessage && (
        <Box p={2}>
          <Alert severity="success" onClose={() => setSyncMessage(null)}>
            {syncMessage}
          </Alert>
        </Box>
      )}

      {/* Content Area */}
      <Box flex={1} overflow="auto" p={2}>
        {filteredTemplates.length === 0 ? (
          /* Empty State */
          <Box
            textAlign="center"
            py={8}
            px={3}
            sx={{
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              mb={3}
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {searchQuery || selectedCategory !== 'All' || selectedFolder !== 'All' ? (
                <SearchOffIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
              ) : (
                <FolderOpenIcon sx={{ fontSize: 60, color: 'text.disabled' }} />
              )}
            </Box>

            <Typography variant="h5" gutterBottom fontWeight={600}>
              {searchQuery || selectedCategory !== 'All' || selectedFolder !== 'All'
                ? 'No templates found'
                : 'Your template library is empty'}
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={3} maxWidth={500}>
              {searchQuery || selectedCategory !== 'All' || selectedFolder !== 'All'
                ? 'Try different keywords or clear filters to see more templates.'
                : 'Start building your email collection by adding HTML templates from your file system. Place your templates in ~/Templates for quick access.'}
            </Typography>

            {searchQuery || selectedCategory !== 'All' || selectedFolder !== 'All' ? (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedFolder('All');
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Box display="flex" gap={2}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddModalOpen(true)} size="large">
                  Add First Template
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FolderOpenIcon />}
                  onClick={() => setAddModalOpen(true)}
                  size="large"
                >
                  Import Folder
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          /* Templates Grid */
          <Grid container spacing={2}>
            {filteredTemplates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <TemplateItem
                  template={template}
                  previewConfig={previewConfig}
                  onDelete={handleTemplateDeleted}
                  onUpdate={handleTemplateUpdated}
                  onLoadTemplate={(html, tmpl) => {
                    console.log('Load template into editor:', tmpl.name);
                    // TODO: Integrate with editor
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Directory Management Modal */}
      <DirectoryManagementModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </Box>
  );
}
