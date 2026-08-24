import { useMemo } from "react";

import { useDebounce } from "@/hooks/useDebounce";

import { buildDocumentHtml } from "../render/buildDocumentHtml";
import { useCanvas, useShellConfig } from "../state/builderStore";

export function BuilderPreviewPane() {
  const shell = useShellConfig();
  const canvas = useCanvas();

  const debouncedShell = useDebounce(shell, 300);
  const debouncedCanvas = useDebounce(canvas, 300);

  const html = useMemo(() => buildDocumentHtml(debouncedShell, debouncedCanvas), [debouncedShell, debouncedCanvas]);

  return <iframe title='Template preview' srcDoc={html} className='w-full h-full min-h-[600px] rounded-lg border border-border/60 bg-white' />;
}
