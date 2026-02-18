import React from "react";
import { Box, Typography, Button, Stack, useTheme, alpha, Tooltip } from "@mui/material";
import { CheckCircle as SuccessIcon, Image as ImageIcon, CheckCircleOutline as CheckIcon, ContentCopy as CopyIcon, Link as LinkIcon } from "@mui/icons-material";
import { spacingMUI, borderRadius } from "../../theme/tokens";
import type { UploadResult } from "../types";

function toShortPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
  } catch {
    return url;
  }
}

interface UploadResultsProps {
  results: UploadResult[];
  copiedUrl: string | null;
  onCopyUrl: (url: string, isShortPath?: boolean) => void;
  onCopyAllUrls: (isShortPath?: boolean) => void;
  cardBackground?: string;
  cardBackdropFilter?: string;
  cardWebkitBackdropFilter?: string;
}

export const UploadResults: React.FC<UploadResultsProps> = ({ results, copiedUrl, onCopyUrl, onCopyAllUrls, cardBackground, cardBackdropFilter, cardWebkitBackdropFilter }) => {
  const theme = useTheme();

  const successCount = results.filter((r) => r.success).length;

  return (
    <Box
      sx={{
        p: spacingMUI.base,
        borderRadius: `${borderRadius.lg}px`,
        backgroundColor: cardBackground || alpha(theme.palette.background.paper, 0.5),
        backdropFilter: cardBackdropFilter,
        WebkitBackdropFilter: cardWebkitBackdropFilter,
        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
      }}>
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={spacingMUI.base}>
        <Box display='flex' alignItems='center' gap={spacingMUI.xs}>
          <SuccessIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
          <Typography variant='subtitle2' fontWeight={600}>
            Uploaded Files ({successCount}/{results.length})
          </Typography>
        </Box>
        {successCount > 0 && (
          <Box display='flex' gap={spacingMUI.xs}>
            <Tooltip title='Copy all full URLs' arrow placement='top'>
              <Button
                size='small'
                onClick={() => onCopyAllUrls(false)}
                startIcon={copiedUrl === "all" ? <CheckIcon /> : <LinkIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: `${borderRadius.md}px`,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}>
                {copiedUrl === "all" ? "✓" : "Copy URLs"}
              </Button>
            </Tooltip>
            <Tooltip title='Copy all short paths' arrow placement='top'>
              <Button
                size='small'
                onClick={() => onCopyAllUrls(true)}
                startIcon={copiedUrl === "all-short" ? <CheckIcon /> : <CopyIcon />}
                variant='outlined'
                sx={{
                  textTransform: "none",
                  borderRadius: `${borderRadius.md}px`,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}>
                {copiedUrl === "all-short" ? "✓" : "Copy Paths"}
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Stack spacing={spacingMUI.xs}>
        {results.map((result, index) => (
          <Box
            key={index}
            sx={{
              p: spacingMUI.sm,
              borderRadius: `${borderRadius.md}px`,
              backgroundColor: result.success ? alpha(theme.palette.success.main, 0.05) : alpha(theme.palette.error.main, 0.05),
              border: `1px solid ${result.success ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.error.main, 0.15)}`,
              display: "flex",
              alignItems: "center",
              gap: spacingMUI.sm,
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: result.success ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.error.main, 0.08),
              },
            }}>
            <ImageIcon
              sx={{
                fontSize: 18,
                color: result.success ? theme.palette.success.main : theme.palette.error.main,
              }}
            />
            <Box flex={1} minWidth={0}>
              <Typography
                variant='body2'
                fontWeight={500}
                sx={{
                  mb: 0.25,
                  color: theme.palette.text.primary,
                }}>
                {result.filename}
              </Typography>
              {result.success ? (
                <Typography
                  variant='caption'
                  sx={{
                    fontFamily: "monospace",
                    color: theme.palette.text.secondary,
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                  {result.url}
                </Typography>
              ) : (
                <Typography variant='caption' color='error.main'>
                  {result.error || "Upload failed"}
                </Typography>
              )}
            </Box>
            {result.success && (
              <Box display='flex' gap={spacingMUI.xs}>
                <Tooltip title='Copy full URL' arrow placement='top'>
                  <Button
                    size='small'
                    onClick={() => onCopyUrl(result.url, false)}
                    startIcon={copiedUrl === result.url ? <CheckIcon /> : <LinkIcon />}
                    sx={{
                      minWidth: "auto",
                      px: spacingMUI.sm,
                      py: spacingMUI.xs,
                      textTransform: "none",
                      borderRadius: `${borderRadius.sm}px`,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: copiedUrl === result.url ? theme.palette.success.main : theme.palette.primary.main,
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}>
                    {copiedUrl === result.url ? "✓" : "URL"}
                  </Button>
                </Tooltip>
                <Tooltip title='Copy short path' arrow placement='top'>
                  <Button
                    size='small'
                    onClick={() => onCopyUrl(result.url, true)}
                    startIcon={copiedUrl === `${result.url}-short` ? <CheckIcon /> : <CopyIcon />}
                    sx={{
                      minWidth: "auto",
                      px: spacingMUI.sm,
                      py: spacingMUI.xs,
                      textTransform: "none",
                      borderRadius: `${borderRadius.sm}px`,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      color: copiedUrl === `${result.url}-short` ? theme.palette.success.main : theme.palette.text.secondary,
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.text.secondary, 0.08),
                      },
                    }}>
                    {copiedUrl === `${result.url}-short` ? "✓" : "Path"}
                  </Button>
                </Tooltip>
              </Box>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export { toShortPath };
