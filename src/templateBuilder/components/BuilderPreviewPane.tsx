import { useMemo } from "react";

import { useDebounce } from "@/hooks/useDebounce";

import { buildDocumentHtml } from "../render/buildDocumentHtml";
import { useNodesMap, useRootIds, useShellConfig } from "../state/builderStore";

export function BuilderPreviewPane() {
  const shell = useShellConfig();
  const nodes = useNodesMap();
  const rootIds = useRootIds();

  const debouncedShell = useDebounce(shell, 300);
  const debouncedNodes = useDebounce(nodes, 300);
  const debouncedRootIds = useDebounce(rootIds, 300);

  const html = useMemo(() => buildDocumentHtml(debouncedShell, debouncedNodes, debouncedRootIds), [debouncedShell, debouncedNodes, debouncedRootIds]);

  return <iframe title='Template preview' srcDoc={html} className='w-full h-full min-h-[600px] rounded-lg border border-border/60 bg-white' />;
}
