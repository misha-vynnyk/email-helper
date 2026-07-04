import { FlaskConical } from "lucide-react";
import type { ReactElement } from "react";
import { useCallback } from "react";
import { toast } from "react-toastify";

import { logger } from "../utils/logger";

type EmailValidationDevToolsProps = {
  onHtmlChange?: (html: string) => void;
};

export default function EmailValidationDevTools({
  onHtmlChange,
}: EmailValidationDevToolsProps): ReactElement {
  const handleLoadTestHtml = useCallback(async () => {
    if (!onHtmlChange) return;

    try {
      const { default: testHtml } = await import("./email-validation-test.html?raw");
      onHtmlChange(testHtml);
      toast.success("Test HTML loaded");
    } catch (error: unknown) {
      logger.error("EmailValidationDevTools", "Failed to load email validation test HTML", error);
      toast.error("Failed to load test HTML");
    }
  }, [onHtmlChange]);

  return (
    <button
      type='button'
      title='DEV: load sample HTML for auto-fix'
      onClick={handleLoadTestHtml}
      disabled={!onHtmlChange}
      className='flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none'
    >
      <FlaskConical className='w-3.5 h-3.5' />
      Test HTML
    </button>
  );
}
