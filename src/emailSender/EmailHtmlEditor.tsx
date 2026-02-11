import React from "react";

import { html } from "@codemirror/lang-html";
import { Clear, Code, Send } from "@mui/icons-material";
import { alpha, Alert, Box, Button, Stack, TextField, Typography, useTheme } from "@mui/material";
import CodeMirror from "@uiw/react-codemirror";

import EmailValidationPanel from "../emailValidator/EmailValidationPanel";
import { StyledPaper, useThemeMode } from "../theme";
import { getComponentStyles } from "../theme/componentStyles";
import { createCodeMirrorTheme } from "../utils/codemirrorTheme";

import { useEmailSender } from "./EmailSenderContext";

const EmailHtmlEditor: React.FC = () => {
  const theme = useTheme();
  const { mode, style } = useThemeMode();
  const componentStyles = React.useMemo(() => getComponentStyles(mode, style), [mode, style]);
  const codeMirrorTheme = createCodeMirrorTheme(theme, mode, style);
  const {
    editorHtml,
    setEditorHtml,
    subject,
    setSubject,
    loading,
    sendEmail,
    isReadyToSend,
    areCredentialsValid,
    serverStatus,
  } = useEmailSender();

  const handleSend = () => {
    sendEmail();
  };

  const handleClearEditor = () => {
    setEditorHtml("");
    // Subject залишаємо без змін
  };

  const isDisabled =
    loading || !isReadyToSend || !areCredentialsValid || serverStatus === "offline";

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
      {/* Основна область з прокруткою */}

      <Box sx={{ flexGrow: 1, overflow: "auto", pr: 1 }}>
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <Code />
          <Typography variant='h6'>Email Template Editor</Typography>
        </Box>

        {serverStatus === "offline" && (
          <Alert
            severity='error'
            sx={{ mb: 3 }}
          >
            Email server is offline. Please start the backend server.
          </Alert>
        )}

        <Stack spacing={3}>
          <TextField
            label='Email Subject'
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            placeholder='Enter email subject...'
            helperText='A descriptive subject line for your email'
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "background.paper",
              },
            }}
          />

          {/* Email Validation Panel */}
          <Box>
            <EmailValidationPanel
              html={editorHtml}
              onHtmlChange={setEditorHtml}
              showCompactView={false}
            />
          </Box>

          <Box>
            <Typography
              variant='subtitle2'
              sx={{ mb: 2, color: "text.secondary", fontWeight: 500 }}
            >
              HTML Content:
            </Typography>
            <StyledPaper
              backgroundAlpha={0.85}
              sx={{
                overflow: "hidden",
                border:
                  componentStyles.card.border === "none" ? "1px solid" : componentStyles.card.border,
                borderColor: componentStyles.card.border === "none" ? "divider" : undefined,
                "& .cm-selectionLayer .cm-selectionBackground": {
                  backgroundColor: `${alpha(theme.palette.primary.main, 0.25)} !important`,
                },
                "& .cm-selectionBackground": {
                  backgroundColor: `${alpha(theme.palette.primary.main, 0.25)} !important`,
                },
                "& .cm-content ::selection": {
                  backgroundColor: `${alpha(theme.palette.primary.main, 0.25)} !important`,
                },
              }}
            >
              <CodeMirror
                value={editorHtml}
                onChange={(value) => setEditorHtml(value)}
                height='400px'
                extensions={[html(), ...codeMirrorTheme]}
                theme={undefined}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  dropCursor: true,
                  allowMultipleSelections: false,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  highlightSelectionMatches: true,
                  searchKeymap: true,
                }}
              />
            </StyledPaper>
          </Box>
        </Stack>
      </Box>

      {/* Sticky панель з усіма кнопками */}
      <StyledPaper
        backgroundAlpha={0.9}
        sx={{
          position: "sticky",
          bottom: 0,
          p: 2,
          mx: -2,
          mt: 2,
          zIndex: 10,
          // look like a bar, not a floating card
          borderRadius: 0,
          borderLeft: "none",
          borderRight: "none",
          borderBottom: "none",
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}
        >
          {/* Ліва частина - кнопка очищення */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant='outlined'
              startIcon={<Clear />}
              onClick={handleClearEditor}
              size='medium'
              color='warning'
              sx={{
                borderColor: "warning.main",
                color: "warning.main",
                "&:hover": {
                  borderColor: "warning.dark",
                  backgroundColor: "warning.50",
                },
              }}
            >
              Clear Editor
            </Button>
          </Box>

          {/* Права частина - статус та кнопка відправки */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {!areCredentialsValid && (
              <Alert
                severity='warning'
                sx={{ py: 0.5, px: 2, fontSize: "0.875rem" }}
              >
                Configure credentials first
              </Alert>
            )}

            <Button
              variant='contained'
              startIcon={<Send />}
              onClick={handleSend}
              disabled={isDisabled}
              size='large'
              sx={{
                minWidth: 160,
                height: 48,
                fontSize: "1rem",
                fontWeight: 600,
                bgcolor: isDisabled ? undefined : "success.main",
                "&:hover": {
                  bgcolor: isDisabled ? undefined : "success.dark",
                  transform: "translateY(-1px)",
                  boxShadow: theme.shadows[4],
                },
                "&:disabled": {
                  opacity: 0.6,
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              {loading ? "Sending..." : "Send Email"}
            </Button>
          </Box>
        </Box>
      </StyledPaper>
    </Box>
  );
};

export { EmailHtmlEditor };
export default EmailHtmlEditor;
