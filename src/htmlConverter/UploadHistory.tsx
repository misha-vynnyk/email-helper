import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  Paper,
  Collapse,
  IconButton,
  useTheme,
  alpha,
  Tooltip,
  Pagination,
} from "@mui/material";
import {
  History as HistoryIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  CheckCircleOutline as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  Schedule as TimeIcon,
  Image as ImageIcon,
} from "@mui/icons-material";

import { useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { borderRadius, spacingMUI } from "../theme/tokens";
import { copyToClipboard } from "./utils/clipboard";
import { UI_TIMINGS, UPLOAD_CONFIG } from "./constants";
import type { UploadSession } from "./types";

interface UploadHistoryProps {
  sessions: UploadSession[];
  onClear: () => void;
}

export default function UploadHistory({ sessions, onClear }: UploadHistoryProps) {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = getComponentStyles(mode, style);

  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination calculations
  const totalPages = Math.ceil(sessions.length / UPLOAD_CONFIG.SESSIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * UPLOAD_CONFIG.SESSIONS_PER_PAGE;
  const endIndex = startIndex + UPLOAD_CONFIG.SESSIONS_PER_PAGE;
  const paginatedSessions = sessions.slice(startIndex, endIndex);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    // Reset expanded sessions when changing page
    setExpandedSessions(new Set());
  };

  // Reset to page 1 when sessions list changes (new upload or clear)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [sessions.length, currentPage, totalPages]);

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedUrl(key);
      setTimeout(() => setCopiedUrl(null), UI_TIMINGS.COPIED_FEEDBACK);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleString('uk-UA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sessions.length === 0) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: spacingMUI.lg,
        borderRadius: `${borderRadius.lg}px`,
        background: componentStyles.card.background || theme.palette.background.paper,
        backdropFilter: componentStyles.card.backdropFilter,
        WebkitBackdropFilter: componentStyles.card.WebkitBackdropFilter,
        border: componentStyles.card.border || `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: componentStyles.card.boxShadow,
      }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={spacingMUI.base}>
        <Box display="flex" alignItems="center" gap={spacingMUI.sm}>
          <HistoryIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight={600}>
            Upload History
          </Typography>
          <Chip
            label={sessions.reduce((sum, s) => sum + s.files.length, 0)}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>
        <Button
          size="small"
          onClick={onClear}
          startIcon={<DeleteIcon />}
          sx={{
            textTransform: 'none',
            borderRadius: `${borderRadius.md}px`,
            color: theme.palette.error.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.08),
            }
          }}
        >
          Clear All
        </Button>
      </Box>

      {/* Sessions List */}
      <Stack spacing={spacingMUI.sm}>
        {paginatedSessions.map((session) => {
          const isExpanded = expandedSessions.has(session.id);
          const successCount = session.files.filter(f => f.url).length;

          return (
            <Box
              key={session.id}
              sx={{
                borderRadius: `${borderRadius.md}px`,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.08)}`,
                }
              }}
            >
              {/* Session Header */}
              <Box
                onClick={() => toggleSession(session.id)}
                sx={{
                  p: spacingMUI.base,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  backgroundColor: alpha(theme.palette.background.default, 0.3),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.03),
                  }
                }}
              >
                <Box display="flex" alignItems="center" gap={spacingMUI.sm} flex={1}>
                  <FolderIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={spacingMUI.xs} mb={0.25}>
                      <Typography variant="body2" fontWeight={600}>
                        {session.folderName}
                      </Typography>
                      <Chip
                        label={session.category}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          backgroundColor: session.category === 'finance'
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.info.main, 0.1),
                          color: session.category === 'finance'
                            ? theme.palette.success.main
                            : theme.palette.info.main,
                        }}
                      />
                    </Box>
                    <Box display="flex" alignItems="center" gap={spacingMUI.sm}>
                      <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                        <TimeIcon sx={{ fontSize: 12 }} />
                        {formatTime(session.timestamp)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {successCount} file{successCount !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <IconButton size="small">
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {/* Session Files */}
              <Collapse in={isExpanded}>
                <Box sx={{ p: spacingMUI.base, pt: spacingMUI.sm }}>
                  <Stack spacing={spacingMUI.xs}>
                    {session.files.map((file) => (
                      <Box
                        key={file.id}
                        sx={{
                          p: spacingMUI.sm,
                          borderRadius: `${borderRadius.sm}px`,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacingMUI.sm,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          }
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                        <Box flex={1} minWidth={0}>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ mb: 0.25 }}
                          >
                            {file.filename}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              color: theme.palette.text.secondary,
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {file.shortPath}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={spacingMUI.xs}>
                          <Tooltip title="Copy full URL" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(file.url, `${file.id}-url`)}
                              sx={{
                                color: copiedUrl === `${file.id}-url`
                                  ? theme.palette.success.main
                                  : theme.palette.primary.main,
                              }}
                            >
                              {copiedUrl === `${file.id}-url` ? (
                                <CheckIcon sx={{ fontSize: 18 }} />
                              ) : (
                                <LinkIcon sx={{ fontSize: 18 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Copy short path" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(file.shortPath, `${file.id}-path`)}
                              sx={{
                                color: copiedUrl === `${file.id}-path`
                                  ? theme.palette.success.main
                                  : theme.palette.text.secondary,
                              }}
                            >
                              {copiedUrl === `${file.id}-path` ? (
                                <CheckIcon sx={{ fontSize: 18 }} />
                              ) : (
                                <CopyIcon sx={{ fontSize: 18 }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Stack>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box
          display="flex"
          justifyContent="center"
          mt={spacingMUI.lg}
          pt={spacingMUI.base}
          borderTop={`1px solid ${alpha(theme.palette.divider, 0.1)}`}
        >
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: `${borderRadius.sm}px`,
                fontWeight: 500,
              },
              '& .Mui-selected': {
                fontWeight: 700,
              },
            }}
          />
        </Box>
      )}
    </Paper>
  );
}
