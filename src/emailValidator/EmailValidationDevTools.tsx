import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import { Alert, Button, Snackbar, Tooltip } from "@mui/material";

import { logger } from "../utils/logger";

type EmailValidationDevToolsProps = {
  onHtmlChange?: (html: string) => void;
};

export default function EmailValidationDevTools({
  onHtmlChange,
}: EmailValidationDevToolsProps): ReactElement {
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const closeSnack = useCallback(() => {
    setSnack((s) => ({ ...s, open: false }));
  }, []);

  const handleLoadTestHtml = useCallback(async () => {
    if (!onHtmlChange) return;

    try {
      const { default: testHtml } = await import("./email-validation-test.html?raw");
      onHtmlChange(testHtml);
      setSnack({ open: true, message: "Test HTML loaded", severity: "success" });
    } catch (error: unknown) {
      logger.error("EmailValidationDevTools", "Failed to load email validation test HTML", error);
      setSnack({ open: true, message: "Failed to load test HTML", severity: "error" });
    }
  }, [onHtmlChange]);

  return (
    <>
      <Tooltip title='DEV: load sample HTML for auto-fix'>
        <span>
          <Button
            size='small'
            variant='outlined'
            onClick={handleLoadTestHtml}
            disabled={!onHtmlChange}
            sx={{ ml: 1 }}
          >
            Test HTML
          </Button>
        </span>
      </Tooltip>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnack}
          severity={snack.severity}
          variant='filled'
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}

