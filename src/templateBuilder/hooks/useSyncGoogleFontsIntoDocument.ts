import { useEffect } from "react";

import { useShellConfig } from "../state/builderStore";

const LINK_ID = "template-builder-google-fonts";

/**
 * Canvas leaf previews (Stage 5) render real `font-family` values inline, same as export — but
 * unlike export (opened in an email client that never loads the linked stylesheet anyway), the
 * canvas is a live page: the picked Google Font needs an actual `<link>` in `document.head` or it
 * silently falls back to the browser default. One tracked `<link>`, kept in sync with
 * `shell.googleFontsHref` — removed once no font is selected, replaced (not duplicated) when the
 * selection changes.
 */
export function useSyncGoogleFontsIntoDocument(): void {
  const shell = useShellConfig();
  const href = shell.googleFontsHref;

  useEffect(() => {
    if (!href) {
      document.getElementById(LINK_ID)?.remove();
      return;
    }
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [href]);
}
